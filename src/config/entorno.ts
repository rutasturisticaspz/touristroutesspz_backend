import 'dotenv/config';

// Carga del entorno del backend.
// Cada parte del sistema tiene su propio archivo y su propia
// configuración:
//   backend/.env         lo de aquí (base de datos, JWT, uploads)
//   frontend/.env.local  lo del sitio público
//   .env (raíz)          sólo lo que necesita docker compose
// Adentro de Docker no hay archivo: las variables las inyecta el
// compose. `dotenv` simplemente no encuentra nada y sigue.

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
