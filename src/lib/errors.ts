// Error con código HTTP, para que el manejador central sepa qué responder.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detalles?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const noEncontrado = (que: string) => new HttpError(404, `${que} no encontrado`);
export const noAutenticado = (msg = 'No autenticado') => new HttpError(401, msg);
export const noAutorizado = (msg = 'No autorizado') => new HttpError(403, msg);
export const solicitudInvalida = (msg: string, detalles?: unknown) =>
  new HttpError(400, msg, detalles);
