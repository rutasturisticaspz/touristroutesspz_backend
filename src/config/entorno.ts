import 'dotenv/config';

// Backend environment loading.
// Each part of the system has its own file and its own configuration:
//   backend/.env         what is here (database, JWT, uploads)
//   frontend/.env.local  the public site's settings
//   .env (root)          only what docker compose needs
// Inside Docker there is no file: compose injects the variables.
// `dotenv` simply finds nothing and moves on.

export function requerido(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor || valor.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${nombre}.\n` +
        `Copie backend/.env.example como backend/.env y complete los valores.`,
    );
  }
  return valor;
}

export function entero(nombre: string, porDefecto: number): number {
  const valor = process.env[nombre];
  if (!valor) return porDefecto;
  const n = Number(valor);
  if (!Number.isInteger(n)) {
    throw new Error(`La variable ${nombre} debe ser un número entero.`);
  }
  return n;
}
