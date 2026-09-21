import { solicitudInvalida } from './errors';

// Reemplazo de la clase QueryOptions original.
// La versión anterior aceptaba un arreglo de cadenas SQL que se
// concatenaban directamente a la consulta, lo que permitía inyección.
// Esta versión sólo acepta nombres de campo previamente autorizados y
// arma objetos que Prisma parametriza por su cuenta.

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

// Lee skip y take desde la query string, con topes sanos.
export function leerPaginacion(query: Record<string, unknown>): Required<OpcionesPaginacion> {
  const skip = numeroOpcional(query.skip, 'skip') ?? 0;
  const takeCrudo = numeroOpcional(query.take, 'take') ?? TAKE_POR_DEFECTO;

  if (skip < 0) throw solicitudInvalida('El parámetro skip no puede ser negativo');
  if (takeCrudo <= 0) throw solicitudInvalida('El parámetro take debe ser mayor que cero');

  return { skip, take: Math.min(takeCrudo, TAKE_MAXIMO) };
}

// Lee el ordenamiento validando el campo contra una lista blanca.
// Un campo no autorizado produce un error, nunca llega a la consulta.
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

// Construye un filtro de texto sobre varios campos.
// El término va como valor en el objeto `where`; Prisma lo parametriza,
// así que no hay forma de que se interprete como SQL.
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

// Combina condiciones ignorando las indefinidas.
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

// Lee un id numérico obligatorio desde la query string o los params.
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
