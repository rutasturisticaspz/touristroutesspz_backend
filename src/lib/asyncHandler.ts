import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Wraps an async handler so any rejected promise reaches Express's
// error handler instead of being left hanging.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
