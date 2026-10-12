import { EstadoEntidad } from '../types/roles';
import { haceDias, leerDiasNuevos } from './fechas';
import { leerPaginacion } from './query';

// "With images" listing, shared by attractions and the other sites.
// By default it is alphabetical. With ?nuevos=<days>, what was created
// within those days goes first (newest first) and the rest follows in
// alphabetical order, with skip/take applied over the two together. It
// cannot be a plain orderBy: "is new" depends on the date, not on a
// column, and a new site named "Zeta" would otherwise never reach the
// first page.

interface Opciones {
  // The Prisma delegate of the main table.
  delegado: any;
  include: unknown;
  darFormato: (fila: any) => unknown;
  query: Record<string, unknown>;
}

export async function listarConImagenes({ delegado, include, darFormato, query }: Opciones) {
  const { skip, take } = leerPaginacion(query);
  const base = {
    state: EstadoEntidad.ACTIVO,
    imagenes: { some: { state: EstadoEntidad.ACTIVO } },
  };
  const dias = leerDiasNuevos(query.nuevos);

  if (dias === undefined) {
    const [datos, total] = await Promise.all([
      delegado.findMany({ where: base, orderBy: { nombre: 'asc' }, skip, take, include }),
      delegado.count({ where: base }),
    ]);
    return { total, datos: datos.map(darFormato) };
  }

  const desde = haceDias(dias);
  const whereNuevos = { ...base, createdAt: { gte: desde } };
  const whereResto = { ...base, createdAt: { lt: desde } };

  const [totalNuevos, totalResto] = await Promise.all([
    delegado.count({ where: whereNuevos }),
    delegado.count({ where: whereResto }),
  ]);

  const nuevos: unknown[] =
    skip < totalNuevos
      ? await delegado.findMany({
          where: whereNuevos,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include,
        })
      : [];

  const faltan = take - nuevos.length;
  const resto: unknown[] =
    faltan > 0
      ? await delegado.findMany({
          where: whereResto,
          orderBy: { nombre: 'asc' },
          skip: Math.max(0, skip - totalNuevos),
          take: faltan,
          include,
        })
      : [];

  return { total: totalNuevos + totalResto, datos: [...nuevos, ...resto].map(darFormato) };
}
