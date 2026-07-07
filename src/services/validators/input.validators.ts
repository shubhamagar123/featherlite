import { ValidationException } from '../exceptions';

export class InputValidator {
  static isEmptyString(value: string | undefined | null): boolean {
    return !value || value.trim().length === 0;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !!emailRegex.test(email);
  }

  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return !!usernameRegex.test(username);
  }

  static isValidUUID(id: string): boolean {
    const uuidRegex = /^[a-zA-Z0-9_-]+$/; // CUID format
    return !!(id && id.length > 0 && uuidRegex.test(id));
  }

  static requireNotEmpty(value: string | undefined | null, fieldName: string): void {
    if (this.isEmptyString(value)) {
      throw new ValidationException(`${fieldName} is required`, fieldName);
    }
  }

  static requireNotNull<T>(value: T | undefined | null, fieldName: string): void {
    if (value === undefined || value === null) {
      throw new ValidationException(`${fieldName} is required`, fieldName);
    }
  }

  static requireValidEmail(email: string, fieldName: string = 'email'): void {
    this.requireNotEmpty(email, fieldName);
    if (!this.isValidEmail(email)) {
      throw new ValidationException(`${fieldName} is not a valid email address`, fieldName);
    }
  }

  static requireValidUsername(username: string, fieldName: string = 'username'): void {
    this.requireNotEmpty(username, fieldName);
    if (!this.isValidUsername(username)) {
      throw new ValidationException(
        `${fieldName} must be 3-30 characters and contain only letters, numbers, hyphens, or underscores`,
        fieldName
      );
    }
  }

  static requireValidUUID(id: string, fieldName: string = 'id'): void {
    this.requireNotEmpty(id, fieldName);
    if (!this.isValidUUID(id)) {
      throw new ValidationException(`${fieldName} is not a valid ID format`, fieldName);
    }
  }

  static requireMinLength(value: string, minLength: number, fieldName: string): void {
    this.requireNotEmpty(value, fieldName);
    if (value.length < minLength) {
      throw new ValidationException(
        `${fieldName} must be at least ${minLength} characters`,
        fieldName
      );
    }
  }

  static requireMaxLength(value: string, maxLength: number, fieldName: string): void {
    this.requireNotEmpty(value, fieldName);
    if (value.length > maxLength) {
      throw new ValidationException(
        `${fieldName} must be at most ${maxLength} characters`,
        fieldName
      );
    }
  }

  static requireInEnum(value: string, validValues: string[] | Record<string, any>, fieldName: string): void {
    const allowedValues = Array.isArray(validValues) ? validValues : Object.values(validValues);
    const allowedKeys = Array.isArray(validValues) ? validValues : Object.keys(validValues);

    if (!allowedValues.includes(value)) {
      throw new ValidationException(
        `${fieldName} must be one of: ${allowedKeys.join(', ')}`,
        fieldName
      );
    }
  }

  static requirePositive(value: number, fieldName: string): void {
    if (value <= 0) {
      throw new ValidationException(`${fieldName} must be positive`, fieldName);
    }
  }

  static requireNonNegative(value: number, fieldName: string): void {
    if (value < 0) {
      throw new ValidationException(`${fieldName} must be non-negative`, fieldName);
    }
  }

  static requireInRange(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw new ValidationException(
        `${fieldName} must be between ${min} and ${max}`,
        fieldName
      );
    }
  }

  static requireNotEmptyArray<T>(array: T[] | undefined, fieldName: string): void {
    if (!array || array.length === 0) {
      throw new ValidationException(`${fieldName} must not be empty`, fieldName);
    }
  }
}
