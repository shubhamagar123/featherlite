import type { Request, Response, NextFunction } from 'express';
import { ApplicationException } from '@application/exceptions/application.exceptions';
import { ResponseBuilder } from '@application/dtos/application.response';
import { createLogger } from '@utils/logger';

const logger = createLogger('ErrorHandlerMiddleware');

/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent format
 */
export function errorHandlerApplicationMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const traceId = String(req.id || `trace_${Date.now()}`);

  // Application exceptions
  if (error instanceof ApplicationException) {
    logger.warn(
      {
        code: (error as any).code,
        statusCode: (error as any).statusCode,
        traceId,
        path: req.path,
      },
      'Application exception'
    );

    res.status((error as any).statusCode).json(
      ResponseBuilder.error((error as any).code, error.message, traceId, (error as any).details)
    );
    return;
  }

  // Validation errors from JSON parsing
  if (error instanceof SyntaxError && 'status' in error && (error as any).status === 400) {
    logger.warn({ traceId, path: req.path }, 'JSON parse error');

    res.status(400).json(
      ResponseBuilder.error('INVALID_JSON', 'Invalid JSON in request body', traceId)
    );
    return;
  }

  // Generic errors
  const message = error instanceof Error ? error.message : 'Internal server error';
  const statusCode =
    typeof error === 'object' && error !== null && 'status' in error && typeof (error as any).status === 'number'
      ? (error as any).status
      : 500;

  logger.error(
    {
      error,
      traceId,
      path: req.path,
      method: req.method,
    },
    'Unhandled error'
  );

  res.status(statusCode).json(
    ResponseBuilder.error(
      'INTERNAL_ERROR',
      message,
      traceId,
      { originalError: message },
      []
    )
  );
}

/**
 * 404 Not Found Handler
 */
export function notFoundHandlerApplicationMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const traceId = String(req.id || `trace_${Date.now()}`);

  logger.debug({ traceId, path: req.path, method: req.method }, '404 Not Found');

  res.status(404).json(
    ResponseBuilder.error(
      'NOT_FOUND',
      `Endpoint ${req.method} ${req.path} not found`,
      traceId
    )
  );
}
