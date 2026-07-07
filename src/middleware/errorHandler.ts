import type { Request, Response, NextFunction } from 'express';
import { isAppError, ErrorCode } from '@utils/error';
import { logger } from '@utils/logger';

export function errorHandlerMiddleware(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const requestId = req.id || 'unknown';

  if (isAppError(err)) {
    logger.warn(
      {
        requestId,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        url: req.url,
        method: req.method,
      },
      'Application error'
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
      timestamp,
    });
    return;
  }

  // Validation errors from express-validator or zod
  if (err.name === 'ValidationError' || err instanceof SyntaxError) {
    logger.warn(
      {
        requestId,
        statusCode: 422,
        message: err.message,
        url: req.url,
        method: req.method,
      },
      'Validation error'
    );

    res.status(422).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation error',
        details: { error: err.message },
      },
      timestamp,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn(
      {
        requestId,
        statusCode: 401,
        message: err.message,
        url: req.url,
      },
      'Invalid token'
    );

    res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Invalid or expired token',
      },
      timestamp,
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn(
      {
        requestId,
        statusCode: 401,
        message: 'Token expired',
        url: req.url,
      },
      'Token expired'
    );

    res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Token has expired',
      },
      timestamp,
    });
    return;
  }

  // Unexpected errors
  logger.error(
    {
      requestId,
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      url: req.url,
      method: req.method,
    },
    'Unhandled error'
  );

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    },
    timestamp,
  });
}

export function notFoundMiddleware(req: Request, res: Response): void {
  const timestamp = new Date().toISOString();

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp,
  });
}
