import path from 'node:path';
import { entero, requerido } from './entorno';

// Backend configuration.
// Everything comes from environment variables, from `backend/.env`.
// There are no fallback values pointing at any server: if a variable
// is missing, the process fails right away instead of connecting to an
// unexpected place. The previous system had an
// `enviroments.prod.config.ts` with the production IP and credentials
// written inside.

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

  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  // Email sending (SMTP). Optional: if it is missing, the system starts
  // anyway and only "Reply by email" in /admin/mensajes fails when used,
  // with a clear notice. Meant for an institutional account (for
  // example, a University SMTP server or a Google Workspace account with
  // an app password) -- never the regular password of a personal Gmail
  // account, which Google does not accept for this.
  correo: {
    host: process.env.SMTP_HOST,
    puerto: entero('SMTP_PORT', 587),
    usuario: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    // Address the email recipient sees. If not set, the same SMTP user is
    // used.
    remitente: process.env.SMTP_FROM ?? process.env.SMTP_USER,
  },
} as const;
