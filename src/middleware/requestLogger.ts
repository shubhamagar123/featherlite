import type { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '@utils/logger';

const pinoHttpMiddleware = pinoHttp({
  logger,
  customLogLevel: (_req: Request, res: Response, err?: Error): string => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (res.statusCode >= 300) return 'debug';
    return 'info';
  },
  customSuccessMessage: (req: Request, res: Response): string => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req: Request, res: Response, err: Error): string => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      'req.query.password',
      'req.body.password',
      'req.body.token',
      'res.headers["x-auth-token"]',
    ],
    remove: true,
  },
});

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  pinoHttpMiddleware(req, res, next);
}
