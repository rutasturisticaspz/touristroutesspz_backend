// Today's date according to the server clock, as UTC midnight.
// Event dates are stored as a day without a time (UTC midnight) and
// the site shows that day as is, so they are compared against the
// server's UTC day, regardless of the time zone the machine has
// configured.
export function hoyDelServidor(): Date {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const MAX_DIAS_NUEVOS = 90;

// ?nuevos=30: how many days back something counts as "new". Without a
// value, or out of range, the list does not tell new ones apart.
export function leerDiasNuevos(valor: unknown): number | undefined {
  const dias = Number(valor);
  return Number.isInteger(dias) && dias >= 1 && dias <= MAX_DIAS_NUEVOS ? dias : undefined;
}

export function haceDias(dias: number): Date {
  return new Date(Date.now() - dias * MS_POR_DIA);
}
