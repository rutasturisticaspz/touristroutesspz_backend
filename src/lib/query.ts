import { solicitudInvalida } from './errors';

// Replacement for the original QueryOptions class.
// The previous version accepted an array of SQL strings that were
// concatenated directly into the query, which allowed injection.
// This version only accepts previously authorized field names and
// builds objects that Prisma parameterizes on its own.

export interface OpcionesPaginacion {
  skip?: number;
  take?: number;
}

export interface OpcionesOrden<TCampo extends string> {
  ordenarPor?: TCampo;
  direccion?: 'asc' | 'desc';
}

const TAKE_POR_DEFECTO = 20;
const TAKE_MAXIMO = 100;

// Reads skip and take from the query string, with sane limits.
export function leerPaginacion(query: Record<string, unknown>): Required<OpcionesPaginacion> {
  const skip = numeroOpcional(query.skip, 'skip') ?? 0;
  const takeCrudo = numeroOpcional(query.take, 'take') ?? TAKE_POR_DEFECTO;

  if (skip < 0) throw solicitudInvalida('El parámetro skip no puede ser negativo');
  if (takeCrudo <= 0) throw solicitudInvalida('El parámetro take debe ser mayor que cero');

  return { skip, take: Math.min(takeCrudo, TAKE_MAXIMO) };
}

// Reads the ordering, validating the field against a whitelist.
// An unauthorized field produces an error and never reaches the query.
export function leerOrden<TCampo extends string>(
  query: Record<string, unknown>,
  camposPermitidos: readonly TCampo[],
  porDefecto: TCampo,
): Record<string, 'asc' | 'desc'> {
  const campoCrudo = typeof query.ordenarPor === 'string' ? query.ordenarPor : undefined;
  const dirCruda = typeof query.direccion === 'string' ? query.direccion.toLowerCase() : undefined;

  let campo: TCampo = porDefecto;
  if (campoCrudo !== undefined) {
    if (!camposPermitidos.includes(campoCrudo as TCampo)) {
      throw solicitudInvalida(
        `No se puede ordenar por "${campoCrudo}". Campos permitidos: ${camposPermitidos.join(', ')}`,
      );
    }
    campo = campoCrudo as TCampo;
  }

  const direccion: 'asc' | 'desc' = dirCruda === 'desc' ? 'desc' : 'asc';
  return { [campo]: direccion };
}

// Builds a text filter over several fields.
// The term goes as a value in the `where` object; Prisma parameterizes
// it, so there is no way for it to be interpreted as SQL.
export function filtroTexto(
  termino: string | undefined,
  campos: readonly string[],
): Record<string, unknown> | undefined {
  const limpio = termino?.trim();
  if (!limpio) return undefined;

  return {
    OR: campos.map((campo) => ({
      [campo]: { contains: limpio },
    })),
  };
}

// Combines conditions, ignoring the undefined ones.
export function combinarWhere(
  ...condiciones: Array<Record<string, unknown> | undefined>
): Record<string, unknown> {
  const presentes = condiciones.filter(
    (c): c is Record<string, unknown> => c !== undefined && Object.keys(c).length > 0,
  );
  if (presentes.length === 0) return {};
  if (presentes.length === 1) return presentes[0];
  return { AND: presentes };
}

// Reads a required numeric id from the query string or the params.
export function leerId(valor: unknown, nombre = 'id'): number {
  const n = numeroOpcional(valor, nombre);
  if (n === undefined) throw solicitudInvalida(`Falta el parámetro ${nombre}`);
  if (n <= 0) throw solicitudInvalida(`El parámetro ${nombre} debe ser positivo`);
  return n;
}

function numeroOpcional(valor: unknown, nombre: string): number | undefined {
  if (valor === undefined || valor === null || valor === '') return undefined;
  const n = Number(valor);
  if (!Number.isInteger(n)) {
    throw solicitudInvalida(`El parámetro ${nombre} debe ser un número entero`);
  }
  return n;
}
