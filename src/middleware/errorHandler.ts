import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { HttpError } from '../lib/errors';
import { config } from '../config';

// Manejador central de errores. Debe registrarse de último.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, detalles: err.detalles });
    return;
  }

  // Errores de subida de archivos: son culpa de la petición, no del
  // servidor, así que responden 400 y no 500.
  if (err instanceof MulterError) {
    const mensaje =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño máximo permitido'
        : `Error al subir el archivo: ${err.message}`;
    res.status(400).json({ error: mensaje, detalles: err.code });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un registro con ese valor único' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ error: 'La operación viola una relación existente' });
      return;
    }
  }

  console.error('Error no controlado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(config.entorno === 'development' && err instanceof Error
      ? { mensaje: err.message }
      : {}),
  });
}

export function noEncontradoHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Ruta no encontrada' });
}
