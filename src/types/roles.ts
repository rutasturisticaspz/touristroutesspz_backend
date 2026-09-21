// Roles del sistema, tal como se guardan en la columna `rol`.
export enum Rol {
  ADMIN = 'ADMIN',
  // OJO: el valor guardado en la base es 'MODERATOR', en inglés, aunque
  // el resto del sistema lo nombre en español. Se conserva tal cual
  // porque así están los 17 usuarios existentes; cambiarlo dejaría al
  // moderador sin poder iniciar sesión.
  MODERADOR = 'MODERATOR',
  PARTICULAR = 'PARTICULAR',
}

// Estados de las entidades, tal como se guardan en la columna `state`.
export enum EstadoEntidad {
  ACTIVO = 'Active',
  INACTIVO = 'Inactive',
}

// Datos que viajan dentro del token. Nunca incluye la contraseña.
export interface PayloadToken {
  id: number;
  email: string;
  rol: Rol;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
    }
  }
}
