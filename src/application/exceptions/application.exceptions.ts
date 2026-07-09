/**
 * Application Layer Exceptions
 * These are caught by global error middleware
 */

export class ApplicationException extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApplicationException';
    Object.setPrototypeOf(this, ApplicationException.prototype);
  }
}

// Authentication Exceptions
export class AuthenticationException extends ApplicationException {
  constructor(message: string = 'Authentication failed', details?: Record<string, unknown>) {
    super('UNAUTHENTICATED', 401, message, details);
    Object.setPrototypeOf(this, AuthenticationException.prototype);
  }
}

export class InvalidTokenException extends ApplicationException {
  constructor(message: string = 'Invalid or expired token', details?: Record<string, unknown>) {
    super('INVALID_TOKEN', 401, message, details);
    Object.setPrototypeOf(this, InvalidTokenException.prototype);
  }
}

// Authorization Exceptions
export class AuthorizationException extends ApplicationException {
  constructor(message: string = 'Access denied', details?: Record<string, unknown>) {
    super('FORBIDDEN', 403, message, details);
    Object.setPrototypeOf(this, AuthorizationException.prototype);
  }
}

export class InsufficientPermissionsException extends ApplicationException {
  constructor(
    permission: string,
    details?: Record<string, unknown>
  ) {
    super(
      'INSUFFICIENT_PERMISSIONS',
      403,
      `Missing permission: ${permission}`,
      details
    );
    Object.setPrototypeOf(this, InsufficientPermissionsException.prototype);
  }
}

// Resource Exceptions
export class ResourceNotFoundException extends ApplicationException {
  constructor(
    resource: string,
    id?: string,
    details?: Record<string, unknown>
  ) {
    super(
      'RESOURCE_NOT_FOUND',
      404,
      `${resource}${id ? ` with id ${id}` : ''} not found`,
      details
    );
    Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
  }
}

export class ResourceAlreadyExistsException extends ApplicationException {
  constructor(
    resource: string,
    identifier?: string,
    details?: Record<string, unknown>
  ) {
    super(
      'RESOURCE_ALREADY_EXISTS',
      409,
      `${resource}${identifier ? ` ${identifier}` : ''} already exists`,
      details
    );
    Object.setPrototypeOf(this, ResourceAlreadyExistsException.prototype);
  }
}

// Validation Exceptions
export class ValidationException extends ApplicationException {
  constructor(
    message: string = 'Validation failed',
    public validationErrors?: Record<string, string[]>,
    details?: Record<string, unknown>
  ) {
    super('VALIDATION_ERROR', 400, message, { ...details, validationErrors });
    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}

export class InvalidInputException extends ApplicationException {
  constructor(message: string = 'Invalid input', details?: Record<string, unknown>) {
    super('INVALID_INPUT', 400, message, details);
    Object.setPrototypeOf(this, InvalidInputException.prototype);
  }
}

// Business Logic Exceptions
export class BusinessLogicException extends ApplicationException {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(code, 422, message, details);
    Object.setPrototypeOf(this, BusinessLogicException.prototype);
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string = 'Operation conflict', details?: Record<string, unknown>) {
    super('CONFLICT', 409, message, details);
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}

// External Service Exceptions
export class ExternalServiceException extends ApplicationException {
  constructor(
    service: string,
    message: string = 'External service error',
    details?: Record<string, unknown>
  ) {
    super('EXTERNAL_SERVICE_ERROR', 503, `${service}: ${message}`, details);
    Object.setPrototypeOf(this, ExternalServiceException.prototype);
  }
}

// Rate Limit Exceptions
export class RateLimitException extends ApplicationException {
  constructor(
    message: string = 'Too many requests',
    retryAfter?: number,
    details?: Record<string, unknown>
  ) {
    super('RATE_LIMIT_EXCEEDED', 429, message, { ...details, retryAfter });
    Object.setPrototypeOf(this, RateLimitException.prototype);
  }
}

// Operation Exceptions
export class OperationTimeoutException extends ApplicationException {
  constructor(operation: string, timeoutMs: number, details?: Record<string, unknown>) {
    super(
      'OPERATION_TIMEOUT',
      504,
      `${operation} timed out after ${timeoutMs}ms`,
      details
    );
    Object.setPrototypeOf(this, OperationTimeoutException.prototype);
  }
}

export class OperationFailedException extends ApplicationException {
  constructor(
    operation: string,
    message: string = 'Operation failed',
    details?: Record<string, unknown>
  ) {
    super('OPERATION_FAILED', 500, `${operation}: ${message}`, details);
    Object.setPrototypeOf(this, OperationFailedException.prototype);
  }
}

// LLM-specific Exceptions
export class LLMException extends ApplicationException {
  constructor(message: string = 'LLM operation failed', details?: Record<string, unknown>) {
    super('LLM_ERROR', 503, message, details);
    Object.setPrototypeOf(this, LLMException.prototype);
  }
}

export class TokenBudgetExceededException extends ApplicationException {
  constructor(budget: number, required: number, details?: Record<string, unknown>) {
    super(
      'TOKEN_BUDGET_EXCEEDED',
      422,
      `Token budget exceeded: ${required}/${budget}`,
      details
    );
    Object.setPrototypeOf(this, TokenBudgetExceededException.prototype);
  }
}
