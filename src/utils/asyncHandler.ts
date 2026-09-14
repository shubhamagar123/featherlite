import type { NextFunction, Request, Response } from 'express';

/**
 * Wraps an async Express route handler so rejected promises reach `next()`
 * (and therefore the global error handler) instead of crashing the process.
 * Usage: app.get('/endpoint', asyncHandler(async (req, res) => {...}))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
