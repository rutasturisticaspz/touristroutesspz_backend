import { prisma } from '../../db/prisma';
import { noAutorizado, noEncontrado, solicitudInvalida } from '../../lib/errors';
import { EstadoEntidad, Rol } from '../../types/roles';
import { leerPaginacion } from '../../lib/query';

// Calificaciones de atracciones hechas por usuarios del sitio público.
// OJO: en la base de producción esta tabla tiene 0 filas. La
// funcionalidad existía en el código anterior pero nunca se usó. Se
// porta para no perderla, no porque haya datos que migrar.
// Diferencia con la versión anterior: allá los cuatro endpoints
// estaban abiertos, así que cualquiera podía editar o borrar la
// calificación de otra persona. Aquí sólo el autor o un administrador
// pueden tocarla.

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

// Sólo el autor o un administrador pueden modificar una calificación.
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

  // El autor es siempre quien tiene la sesión, no lo que venga en el cuerpo.
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
