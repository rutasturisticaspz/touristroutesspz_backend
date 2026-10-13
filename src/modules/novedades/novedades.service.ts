import { prisma } from '../../db/prisma';
import { EstadoEntidad } from '../../types/roles';
import { haceDias, leerDiasNuevos } from '../../lib/fechas';
import { filtroEventosProximos } from '../eventos/eventos.service';

// How many sites were created in each section within the last N days.
// "New" is a matter of the date alone, the same for everybody: it stays
// until the days run out, whether or not someone already looked at it.
// It is the same rule the lists use to put the new ones first and to
// draw the "New" ribbon (?nuevos=<days>).

const DIAS_POR_DEFECTO = 30;

// The lists only show sites that have at least one image, so only those
// count: otherwise the badge would announce something the list does not
// show yet.
const sitioNuevo = (desde: Date) => ({
  state: EstadoEntidad.ACTIVO,
  createdAt: { gte: desde },
  imagenes: { some: { state: EstadoEntidad.ACTIVO } },
});

const CONTADORES = {
  atracciones: (desde: Date) => prisma.atracciones.count({ where: sitioNuevo(desde) }),
  restaurantes: (desde: Date) => prisma.restaurantes.count({ where: sitioNuevo(desde) }),
  hoteles: (desde: Date) => prisma.hoteles.count({ where: sitioNuevo(desde) }),
  oficinas: (desde: Date) => prisma.oficinasTuristicas.count({ where: sitioNuevo(desde) }),
  operadores: (desde: Date) => prisma.operadoresTuristicos.count({ where: sitioNuevo(desde) }),
  rentadoras: (desde: Date) => prisma.rentadorasVehiculos.count({ where: sitioNuevo(desde) }),
  // The events page lists every event, with or without a picture. One
  // that already happened is not news even if it was loaded today.
  eventos: (desde: Date) =>
    prisma.eventos.count({
      where: {
        state: EstadoEntidad.ACTIVO,
        createdAt: { gte: desde },
        ...filtroEventosProximos(),
      },
    }),
} as const;

export type SeccionNovedades = keyof typeof CONTADORES;

export const SECCIONES_NOVEDADES = Object.keys(CONTADORES) as SeccionNovedades[];

export const novedadesService = {
  async conteos(query: Record<string, unknown>) {
    const desde = haceDias(leerDiasNuevos(query.nuevos) ?? DIAS_POR_DEFECTO);
    const entradas = await Promise.all(
      SECCIONES_NOVEDADES.map(async (seccion) => [seccion, await CONTADORES[seccion](desde)] as const),
    );
    return { conteos: Object.fromEntries(entradas) };
  },
};
