import { prisma } from '../../db/prisma';
import { noAutorizado, noEncontrado, solicitudInvalida } from '../../lib/errors';
import { EstadoEntidad, Rol } from '../../types/roles';
import { leerPaginacion } from '../../lib/query';

// Tourist routes: lists of attractions put together by a user.
// Like ratings, this table has 0 rows in production. It is ported so
// the feature is not lost, and with the same fix: before, anyone
// could edit someone else's route.

const RELACIONES = {
  usuario: { select: { id: true, nombre: true } },
  atracciones: {
    include: {
      atraccion: {
        include: {
          ubicacion: true,
          imagenes: { where: { state: EstadoEntidad.ACTIVO } },
        },
      },
    },
  },
};

// Flattens the join table, same as in the other modules.
function darFormato(ruta: any) {
  if (!ruta) return ruta;
  const { atracciones, ...resto } = ruta;
  return { ...resto, atracciones: atracciones?.map((a: any) => a.atraccion) ?? [] };
}

async function obtenerCrudo(id: number) {
  const ruta = await prisma.rutasTuristicas.findUnique({ where: { id }, include: RELACIONES });
  if (!ruta) throw noEncontrado('Ruta turística');
  return ruta;
}

function verificarDueno(ruta: { usuarioId: number | null }, actor: { id: number; rol: string }) {
  if (actor.rol === Rol.ADMIN) return;
  if (ruta.usuarioId !== actor.id) {
    throw noAutorizado('Sólo puede modificar sus propias rutas');
  }
}

export const rutasService = {
  async listar(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);

    const where: Record<string, unknown> = { state: EstadoEntidad.ACTIVO };
    if (query.usuarioId !== undefined && query.usuarioId !== '') {
      const n = Number(query.usuarioId);
      if (!Number.isInteger(n) || n <= 0) {
        throw solicitudInvalida('usuarioId debe ser un entero positivo');
      }
      where.usuarioId = n;
    }

    const [datos, total] = await Promise.all([
      prisma.rutasTuristicas.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip,
        take,
        include: RELACIONES,
      }),
      prisma.rutasTuristicas.count({ where }),
    ]);

    return { total, datos: datos.map(darFormato) };
  },

  async obtenerPorId(id: number) {
    return darFormato(await obtenerCrudo(id));
  },

  async crear(usuarioId: number, datos: { nombre: string; atraccionIds?: number[] }) {
    const ruta = await prisma.rutasTuristicas.create({
      data: { nombre: datos.nombre, usuarioId, state: EstadoEntidad.ACTIVO },
    });

    if (datos.atraccionIds?.length) {
      await prisma.rutasTuristicasAtracciones.createMany({
        data: datos.atraccionIds.map((atraccionesId) => ({
          rutasTuristicasId: ruta.id,
          atraccionesId,
        })),
        skipDuplicates: true,
      });
    }

    return rutasService.obtenerPorId(ruta.id);
  },

  async actualizar(id: number, actor: { id: number; rol: string }, datos: { nombre?: string }) {
    const ruta = await obtenerCrudo(id);
    verificarDueno(ruta, actor);

    await prisma.rutasTuristicas.update({
      where: { id },
      data: { ...datos, updateAt: new Date() },
    });
    return rutasService.obtenerPorId(id);
  },

  // Completely replaces the route's attractions.
  async definirAtracciones(id: number, actor: { id: number; rol: string }, ids: number[]) {
    const ruta = await obtenerCrudo(id);
    verificarDueno(ruta, actor);

    await prisma.$transaction([
      prisma.rutasTuristicasAtracciones.deleteMany({ where: { rutasTuristicasId: id } }),
      prisma.rutasTuristicasAtracciones.createMany({
        data: ids.map((atraccionesId) => ({ rutasTuristicasId: id, atraccionesId })),
        skipDuplicates: true,
      }),
    ]);

    return rutasService.obtenerPorId(id);
  },

  async desactivar(id: number, actor: { id: number; rol: string }) {
    const ruta = await obtenerCrudo(id);
    verificarDueno(ruta, actor);

    return prisma.rutasTuristicas.update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },
};
