import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Envuelve un handler asíncrono para que cualquier promesa rechazada
// llegue al manejador de errores de Express en vez de quedar colgada.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
