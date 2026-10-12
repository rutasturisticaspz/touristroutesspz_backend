// System roles, as stored in the `rol` column.
export enum Rol {
  ADMIN = 'ADMIN',
  // NOTE: the value stored in the database is 'MODERATOR', in English,
  // even though the rest of the system names it in Spanish. It is kept
  // as is because that is how the 17 existing users are stored; changing
  // it would leave moderators unable to sign in.
  MODERADOR = 'MODERATOR',
  PARTICULAR = 'PARTICULAR',
}

// Entity states, as stored in the `state` column.
export enum EstadoEntidad {
  ACTIVO = 'Active',
  INACTIVO = 'Inactive',
}

// Data carried inside the token. It never includes the password.
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
