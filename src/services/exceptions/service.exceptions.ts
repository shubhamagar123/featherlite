export abstract class ServiceException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, ServiceException.prototype);
  }
}

export class ValidationException extends ServiceException {
  constructor(
    message: string,
    public readonly field?: string,
    details?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}

export class NotFoundError extends ServiceException {
  constructor(entity: string, id?: string) {
    const message = id ? `${entity} with id ${id} not found` : `${entity} not found`;
    super(message, 'NOT_FOUND', 404, { entity, id });
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends ServiceException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFLICT', 409, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class DuplicateResourceError extends ConflictError {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} '${value}' already exists`, { entity, field, value });
    Object.setPrototypeOf(this, DuplicateResourceError.prototype);
  }
}

export class InvalidStateError extends ServiceException {
  constructor(
    message: string,
    public readonly currentState?: string,
    public readonly validStates?: string[],
    details?: Record<string, any>
  ) {
    super(message, 'INVALID_STATE', 400, details || { currentState, validStates });
    Object.setPrototypeOf(this, InvalidStateError.prototype);
  }
}

export class UnauthorizedError extends ServiceException {
  constructor(message: string = 'Unauthorized', details?: Record<string, any>) {
    super(message, 'UNAUTHORIZED', 401, details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends ServiceException {
  constructor(message: string = 'Forbidden', details?: Record<string, any>) {
    super(message, 'FORBIDDEN', 403, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConstraintViolationError extends ServiceException {
  constructor(message: string, constraint: string, details?: Record<string, any>) {
    super(message, 'CONSTRAINT_VIOLATION', 400, { constraint, ...details });
    Object.setPrototypeOf(this, ConstraintViolationError.prototype);
  }
}

export class OptimisticLockError extends ConflictError {
  constructor(entity: string, id: string, expectedVersion: number, actualVersion: number) {
    super(`${entity} version conflict: expected ${expectedVersion}, got ${actualVersion}`, {
      entity,
      id,
      expectedVersion,
      actualVersion,
    });
    Object.setPrototypeOf(this, OptimisticLockError.prototype);
  }
}

export class InvalidRelationError extends ServiceException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'INVALID_RELATION', 400, details);
    Object.setPrototypeOf(this, InvalidRelationError.prototype);
  }
}
