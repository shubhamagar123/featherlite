import type { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import type { LevelWithSilent } from 'pino';
import { logger } from '@utils/logger';

// Max size of request/response body to log (4KB)
const MAX_BODY_LOG_SIZE = 4096;

/**
 * Redact sensitive paths from logs
 * Covers: auth tokens, API keys, PII, credentials
 */
const REDACT_PATHS = [
  // Authorization
  'req.headers.authorization',
  'req.headers["x-api-key"]',
  'req.headers["x-auth-token"]',
  'req.headers["authorization"]',

  // Query string secrets
  'req.query.token',
  'req.query.apiKey',
  'req.query.api_key',
  'req.query.password',
  'req.query.secret',

  // Body fields
  'req.body.password',
  'req.body.token',
  'req.body.apiKey',
  'req.body.api_key',
  'req.body.refreshToken',
  'req.body.refresh_token',
  'req.body.secret',
  'req.body.email', // PII - opt-in redaction
  'req.body.ssn', // SSN
  'req.body.creditCard',
  'req.body.credit_card',

  // Response headers
  'res.headers["x-auth-token"]',
  'res.headers["set-cookie"]',

  // Cookies
  'req.headers.cookie',
];

const pinoHttpMiddleware = pinoHttp({
  logger,
  customLogLevel: (_req: Request, res: Response, err?: Error): LevelWithSilent => {
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
    paths: REDACT_PATHS,
    remove: true,
  },
  serializers: {
    // Limit request body size in logs
    req: (req: Request) => {
      const serialized: any = {
        id: req.id,
        method: req.method,
        url: req.url,
        headers: req.headers,
        remoteAddress: req.ip,
        remotePort: (req.socket as any).remotePort,
      };

      // Only log body if under size limit
      if (req.body) {
        const bodyStr =
          typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body);
        if (bodyStr.length > MAX_BODY_LOG_SIZE) {
          serialized.body = `[body truncated, size: ${bodyStr.length}]`;
        } else {
          serialized.body = req.body;
        }
      }

      return serialized;
    },
  },
});

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  pinoHttpMiddleware(req, res, next);
}
