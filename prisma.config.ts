import path from 'node:path';
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Configuración de la CLI de Prisma (generate, db pull, migrate,
 * studio, db seed).
 *
 * OJO con el `import 'dotenv/config'`: desde que existe este archivo,
 * Prisma deja de cargar el .env por su cuenta. Sin esa línea,
 * `prisma studio` y `prisma migrate` no encuentran DATABASE_URL aunque
 * el backend sí arranque.
 *
 * También mueve aquí la configuración del seed, que antes vivía en el
 * campo "prisma" del package.json y salía como deprecada en cada
 * comando.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
