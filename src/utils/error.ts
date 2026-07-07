import type { Response } from 'express';
import { logError } from './logger';

export enum ErrorCode {
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',

  // Client Errors
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Authentication
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  MISSING_TOKEN = 'MISSING_TOKEN',

  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): object {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// HTTP Error Classes
export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, ErrorCode.BAD_REQUEST, message, details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: Record<string, unknown>) {
    super(401, ErrorCode.UNAUTHORIZED, message, details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: Record<string, unknown>) {
    super(403, ErrorCode.FORBIDDEN, message, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, ErrorCode.NOT_FOUND, `${resource} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(409, ErrorCode.CONFLICT, message, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(422, ErrorCode.VALIDATION_ERROR, message, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(500, ErrorCode.INTERNAL_SERVER_ERROR, message, details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function handleError(error: unknown, res: Response): void {
  if (isAppError(error)) {
    logError(error, { code: error.code, statusCode: error.statusCode });
    res.status(error.statusCode).json(error.toJSON());
  } else if (error instanceof Error) {
    logError(error);
    res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    });
  } else {
    logError(new Error('Unknown error'), { error });
    res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    });
  }
}
