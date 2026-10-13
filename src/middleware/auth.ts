import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { noAutenticado, noAutorizado } from '../lib/errors';
import { Rol, type PayloadToken } from '../types/roles';

// Authentication and authorization.
// Differences from the previous version:
//  1. Before, there was a table mapping route -> role, and almost all
//     write routes were marked as public. Here protection is declared
//     in each router: whatever is not marked as public stays closed.
//  2. The token no longer carries the full user object (which included
//     the password hash). It only carries id, email and role.

export function firmarToken(payload: PayloadToken): string {
  return jwt.sign(payload, config.jwt.secreto, {
    expiresIn: config.jwt.expiracion,
  } as jwt.SignOptions);
}

// Reads the token if present, but does not require it. Useful on
// public routes.
export function autenticacionOpcional(req: Request, _res: Response, next: NextFunction): void {
  const payload = leerToken(req);
  if (payload) req.usuario = payload;
  next();
}

// Requires a valid token.
export function requiereAutenticacion(req: Request, _res: Response, next: NextFunction): void {
  const payload = leerToken(req);
  if (!payload) throw noAutenticado('Se requiere iniciar sesión');
  req.usuario = payload;
  next();
}

// Requires one of the given roles.
// ADMIN always passes, to keep the previous behavior where the
// administrator had access to everything.
export function requiereRol(...rolesPermitidos: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const payload = leerToken(req);
    if (!payload) throw noAutenticado('Se requiere iniciar sesión');

    req.usuario = payload;

    if (payload.rol === Rol.ADMIN) return next();
    if (!rolesPermitidos.includes(payload.rol)) {
      throw noAutorizado('No tiene permisos para realizar esta acción');
    }
    next();
  };
}

// Shortcut: only administrators and moderators can write content.
export const requiereEdicion = requiereRol(Rol.MODERADOR);

// Shortcut: administrators only.
export const requiereAdmin = requiereRol(Rol.ADMIN);

function leerToken(req: Request): PayloadToken | undefined {
  const cabecera = req.headers.authorization;
  if (!cabecera) return undefined;

  const [esquema, token] = cabecera.split(' ');
  if (!token || esquema?.toLowerCase() !== 'bearer') return undefined;

  try {
    const decodificado = jwt.verify(token, config.jwt.secreto);
    if (typeof decodificado !== 'object' || decodificado === null) return undefined;

    const { id, email, rol } = decodificado as Record<string, unknown>;
    if (typeof id !== 'number' || typeof email !== 'string' || typeof rol !== 'string') {
      return undefined;
    }
    if (!Object.values(Rol).includes(rol as Rol)) return undefined;

    return { id, email, rol: rol as Rol };
  } catch {
    return undefined;
  }
}
