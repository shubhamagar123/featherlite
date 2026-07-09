import type { Request, Response, NextFunction } from 'express';
import { isAppError, ErrorCode } from '@utils/error';
import { logger } from '@utils/logger';
import { ErrorTracker, ErrorCategory } from '@infra/observability/error-tracker';
import { MetricsCollector } from '@infra/observability/metrics';
import { trace, context } from '@opentelemetry/api';

export function errorHandlerMiddleware(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const requestId = String(req.id || 'unknown');
  const tracer = trace.getTracer('error-handler');
  const span = tracer.startSpan('error.handle');

  context.with(trace.setSpan(context.active(), span), () => {
    handleError(err, req, res, requestId, timestamp);
  });

  span.end();
}

function handleError(err: Error, req: Request, res: Response, requestId: string, timestamp: string): void {

  if (isAppError(err)) {
    const category = ErrorTracker.categorizeError(err);
    const severity = ErrorTracker.getSeverity(category, err.statusCode);

    ErrorTracker.track({
      category,
      statusCode: err.statusCode,
      message: err.message,
      severity,
      retriable: ErrorTracker.isRetriable(category, err.statusCode),
      requestId,
      context: err.details,
    });

    MetricsCollector.recordError(category, severity);

    logger.warn(
      {
        requestId,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        url: req.url,
        method: req.method,
        category,
        severity,
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
      requestId,
    });
    return;
  }

  // Validation errors from express-validator or zod
  if (err.name === 'ValidationError' || err instanceof SyntaxError) {
    const category = ErrorCategory.VALIDATION;

    ErrorTracker.track({
      category,
      statusCode: 422,
      message: err.message,
      severity: 'low',
      retriable: false,
      requestId,
    });

    MetricsCollector.recordError(category, 'low');

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
      requestId,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const category = ErrorCategory.AUTHENTICATION;

    ErrorTracker.track({
      category,
      statusCode: 401,
      message: err.message,
      severity: 'low',
      retriable: false,
      requestId,
    });

    MetricsCollector.recordError(category, 'low');

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
      requestId,
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const category = ErrorCategory.AUTHENTICATION;

    ErrorTracker.track({
      category,
      statusCode: 401,
      message: 'Token expired',
      severity: 'low',
      retriable: false,
      requestId,
    });

    MetricsCollector.recordError(category, 'low');

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
      requestId,
    });
    return;
  }

  // Unexpected errors
  const category = ErrorTracker.categorizeError(err);
  const statusCode = ErrorTracker.getStatusCode(category);
  const severity = ErrorTracker.getSeverity(category, statusCode);

  ErrorTracker.track({
    category,
    statusCode,
    message: err.message,
    severity,
    retriable: ErrorTracker.isRetriable(category, statusCode),
    requestId,
    context: { stack: err.stack, name: err.name },
  });

  MetricsCollector.recordError(category, severity);

  logger.error(
    {
      requestId,
      category,
      severity,
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

  res.status(statusCode).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    },
    timestamp,
    requestId,
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
