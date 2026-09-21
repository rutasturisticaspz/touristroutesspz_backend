import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { noAutenticado, noAutorizado } from '../lib/errors';
import { Rol, type PayloadToken } from '../types/roles';

// Autenticación y autorización.
// Diferencia respecto a la versión anterior:
//  1. Antes existía una tabla que mapeaba ruta -> rol, y casi todas las
//     rutas de escritura estaban marcadas como públicas. Aquí la
//     protección se declara en cada router: lo que no se marca como
//     público, queda cerrado.
//  2. El token ya no transporta el objeto completo del usuario (que
//     incluía el hash de la contraseña). Sólo lleva id, email y rol.

export function firmarToken(payload: PayloadToken): string {
  return jwt.sign(payload, config.jwt.secreto, {
    expiresIn: config.jwt.expiracion,
  } as jwt.SignOptions);
}

// Lee el token si viene, pero no obliga. Útil en rutas públicas.
export function autenticacionOpcional(req: Request, _res: Response, next: NextFunction): void {
  const payload = leerToken(req);
  if (payload) req.usuario = payload;
  next();
}

// Exige un token válido.
export function requiereAutenticacion(req: Request, _res: Response, next: NextFunction): void {
  const payload = leerToken(req);
  if (!payload) throw noAutenticado('Se requiere iniciar sesión');
  req.usuario = payload;
  next();
}

// Exige uno de los roles indicados.
// ADMIN siempre pasa, para conservar el comportamiento anterior donde
// el administrador tenía acceso a todo.
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

// Atajo: sólo administradores y moderadores pueden escribir contenido.
export const requiereEdicion = requiereRol(Rol.MODERADOR);

// Atajo: sólo administradores.
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
