import path from 'node:path';
import { entero, requerido } from './entorno';

// Configuración del backend.
// Todo sale de variables de entorno, de `backend/.env`. No hay valores
// de respaldo que apunten a ningún servidor: si falta una variable, el
// proceso falla de inmediato en vez de conectarse a un lugar
// inesperado. El sistema anterior tenía un `enviroments.prod.config.ts`
// con la IP y las credenciales de producción escritas adentro.

export const config = {
  puerto: entero('PORT', 2999),
  entorno: process.env.NODE_ENV ?? 'development',

  // Fuera de Docker apunta a 127.0.0.1; el compose la reemplaza por
  // el host "db", que es el nombre del contenedor de MySQL en su red.
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

  // Envio de correo (SMTP). Opcional: si falta, el sistema arranca
  // igual y solo "Responder por correo" en /admin/mensajes falla al
  // usarse, con un aviso claro. Pensado para una cuenta institucional
  // (por ejemplo, un SMTP de la Universidad o una cuenta de Google
  // Workspace con contrasena de aplicacion) -- nunca la contrasena
  // normal de una cuenta de Gmail personal, que Google no acepta para
  // esto.
  correo: {
    host: process.env.SMTP_HOST,
    puerto: entero('SMTP_PORT', 587),
    usuario: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    // Direccion que ve quien recibe el correo. Si no se define, se usa
    // el mismo usuario SMTP.
    remitente: process.env.SMTP_FROM ?? process.env.SMTP_USER,
  },
} as const;
