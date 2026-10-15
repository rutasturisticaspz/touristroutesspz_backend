import path from 'node:path';
import { entero, requerido } from './entorno';

// Backend configuration.
// Everything comes from environment variables, from `backend/.env`.
// There are no fallback values pointing at any server: if a variable
// is missing, the process fails right away instead of connecting to an
// unexpected place. The previous system had an
// `enviroments.prod.config.ts` with the production IP and credentials
// written inside.

const DEFAULT_ORIGIN = 'http://localhost:3000';

export const config = {
  puerto: entero('PORT', 2999),
  entorno: process.env.NODE_ENV ?? 'development',

  // Outside Docker it points to 127.0.0.1; compose replaces it with the
  // host "db", which is the name of the MySQL container on its network.
  databaseUrl: requerido('DATABASE_URL'),

  jwt: {
    secreto: requerido('JWT_SECRET'),
    expiracion: process.env.JWT_EXPIRATION ?? '10h',
  },

  uploads: {
    directorio: path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? 'uploads'),
    rutaPublica: '/uploads',
    tamanoMaximoBytes: 10 * 1024 * 1024,
  },

  corsOrigin: process.env.CORS_ORIGIN ?? DEFAULT_ORIGIN,

  // Public address of the site, used to build the links sent by email
  // (password links). It is normally the same as CORS_ORIGIN.
  siteUrl: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? DEFAULT_ORIGIN,

  correo: {
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    remitente: process.env.SMTP_FROM,
  },
} as const;
