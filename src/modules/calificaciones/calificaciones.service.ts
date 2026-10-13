import { prisma } from '../../db/prisma';
import { noAutorizado, noEncontrado, solicitudInvalida } from '../../lib/errors';
import { EstadoEntidad, Rol } from '../../types/roles';
import { leerPaginacion } from '../../lib/query';

// Attraction ratings made by users of the public site.
// NOTE: in the production database this table has 0 rows. The feature
// existed in the previous code but was never used. It is ported so it
// is not lost, not because there is data to migrate.
// Difference from the previous version: there, all four endpoints
// were open, so anyone could edit or delete someone else's rating.
// Here only the author or an administrator can touch it.

const RELACIONES = {
  usuario: { select: { id: true, nombre: true } },
  atraccion: { select: { id: true, nombre: true } },
};

async function obtenerCrudo(id: number) {
  const calificacion = await prisma.calificaciones.findUnique({
    where: { id },
    include: RELACIONES,
  });
  if (!calificacion) throw noEncontrado('Calificación');
  return calificacion;
}

// Only the author or an administrator can modify a rating.
function verificarDueno(
  calificacion: { usuarioId: number | null },
  actor: { id: number; rol: string },
) {
  if (actor.rol === Rol.ADMIN) return;
  if (calificacion.usuarioId !== actor.id) {
    throw noAutorizado('Sólo puede modificar sus propias calificaciones');
  }
}

export const calificacionesService = {
  async listar(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);

    const where: Record<string, unknown> = { state: EstadoEntidad.ACTIVO };
    for (const campo of ['atraccionId', 'usuarioId'] as const) {
      const valor = query[campo];
      if (valor === undefined || valor === '') continue;
      const n = Number(valor);
      if (!Number.isInteger(n) || n <= 0) {
        throw solicitudInvalida(`${campo} debe ser un entero positivo`);
      }
      where[campo] = n;
    }

    const [datos, total] = await Promise.all([
      prisma.calificaciones.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: RELACIONES,
      }),
      prisma.calificaciones.count({ where }),
    ]);

    return { total, datos };
  },

  obtenerPorId: obtenerCrudo,

  // The author is always whoever holds the session, not what comes in
  // the body.
  async crear(usuarioId: number, datos: { atraccionId: number; descripcion?: string | null }) {
    const atraccion = await prisma.atracciones.findUnique({
      where: { id: datos.atraccionId },
      select: { id: true },
    });
    if (!atraccion) throw noEncontrado('Atracción');

    return prisma.calificaciones.create({
      data: {
        descripcion: datos.descripcion ?? '',
        usuarioId,
        atraccionId: datos.atraccionId,
        state: EstadoEntidad.ACTIVO,
      },
      include: RELACIONES,
    });
  },

  async actualizar(
    id: number,
    actor: { id: number; rol: string },
    datos: { descripcion?: string | null },
  ) {
    const calificacion = await obtenerCrudo(id);
    verificarDueno(calificacion, actor);

    return prisma.calificaciones.update({
      where: { id },
      data: { ...datos, updateAt: new Date() },
      include: RELACIONES,
    });
  },

  async desactivar(id: number, actor: { id: number; rol: string }) {
    const calificacion = await obtenerCrudo(id);
    verificarDueno(calificacion, actor);

    return prisma.calificaciones.update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },
};
