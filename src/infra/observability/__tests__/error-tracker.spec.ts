import { ErrorTracker, ErrorCategory } from '../error-tracker';

describe('ErrorTracker', () => {
  describe('categorizeError', () => {
    it('categorizes validation errors', () => {
      const err = new Error('Field is required');
      err.name = 'ValidationError';
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.VALIDATION);
    });

    it('categorizes authentication errors', () => {
      const err = new Error('Invalid token');
      err.name = 'JsonWebTokenError';
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.AUTHENTICATION);
    });

    it('categorizes token expired errors', () => {
      const err = new Error('Token expired');
      err.name = 'TokenExpiredError';
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.AUTHENTICATION);
    });

    it('categorizes authorization errors', () => {
      const err = new Error('Unauthorized access');
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('categorizes not found errors', () => {
      const err = new Error('Resource not found');
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.NOT_FOUND);
    });

    it('categorizes rate limit errors', () => {
      const err = new Error('Too many requests');
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.RATE_LIMIT);
    });

    it('categorizes timeout errors', () => {
      const err = new Error('Request timed out');
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.TIMEOUT);
    });

    it('categorizes database errors', () => {
      const err = new Error('Database query failed');
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.DATABASE);
    });

    it('categorizes cache errors', () => {
      const err = new Error('Redis connection failed');
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.CACHE);
    });

    it('categorizes LLM errors', () => {
      const err = new Error('Model inference failed');
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.LLM);
    });

    it('defaults to unknown for unrecognized errors', () => {
      const err = new Error('Some random error');
      expect(ErrorTracker.categorizeError(err)).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('getStatusCode', () => {
    it('returns 422 for validation errors', () => {
      expect(ErrorTracker.getStatusCode(ErrorCategory.VALIDATION)).toBe(422);
    });

    it('returns 401 for authentication errors', () => {
      expect(ErrorTracker.getStatusCode(ErrorCategory.AUTHENTICATION)).toBe(401);
    });

    it('returns 403 for authorization errors', () => {
      expect(ErrorTracker.getStatusCode(ErrorCategory.AUTHORIZATION)).toBe(403);
    });

    it('returns 404 for not found errors', () => {
      expect(ErrorTracker.getStatusCode(ErrorCategory.NOT_FOUND)).toBe(404);
    });

    it('returns 429 for rate limit errors', () => {
      expect(ErrorTracker.getStatusCode(ErrorCategory.RATE_LIMIT)).toBe(429);
    });

    it('returns 504 for timeout errors', () => {
      expect(ErrorTracker.getStatusCode(ErrorCategory.TIMEOUT)).toBe(504);
    });

    it('returns 502 for database errors', () => {
      expect(ErrorTracker.getStatusCode(ErrorCategory.DATABASE)).toBe(502);
    });

    it('returns 500 for unknown errors', () => {
      expect(ErrorTracker.getStatusCode(ErrorCategory.UNKNOWN)).toBe(500);
    });
  });

  describe('getSeverity', () => {
    it('returns critical for 503 status code', () => {
      expect(ErrorTracker.getSeverity(ErrorCategory.UNKNOWN, 503)).toBe('critical');
    });

    it('returns high for 429 rate limit', () => {
      expect(ErrorTracker.getSeverity(ErrorCategory.RATE_LIMIT, 429)).toBe('high');
    });

    it('returns low for validation errors', () => {
      expect(ErrorTracker.getSeverity(ErrorCategory.VALIDATION, 422)).toBe('low');
    });

    it('returns medium for timeouts', () => {
      expect(ErrorTracker.getSeverity(ErrorCategory.TIMEOUT, 504)).toBe('medium');
    });
  });

  describe('isRetriable', () => {
    it('returns false for validation errors', () => {
      expect(ErrorTracker.isRetriable(ErrorCategory.VALIDATION, 422)).toBe(false);
    });

    it('returns false for authentication errors', () => {
      expect(ErrorTracker.isRetriable(ErrorCategory.AUTHENTICATION, 401)).toBe(false);
    });

    it('returns false for 4xx status codes', () => {
      expect(ErrorTracker.isRetriable(ErrorCategory.NOT_FOUND, 404)).toBe(false);
    });

    it('returns true for 5xx status codes', () => {
      expect(ErrorTracker.isRetriable(ErrorCategory.DATABASE, 502)).toBe(true);
    });

    it('returns true for timeout errors', () => {
      expect(ErrorTracker.isRetriable(ErrorCategory.TIMEOUT, 504)).toBe(true);
    });
  });

  describe('track', () => {
    it('increments error count', () => {
      ErrorTracker.resetStats();
      ErrorTracker.track({
        category: ErrorCategory.VALIDATION,
        statusCode: 422,
        message: 'Validation failed',
        severity: 'low',
        retriable: false,
        requestId: 'test-1',
      });

      const stats = ErrorTracker.getErrorStats();
      expect(stats['validation:422']).toBe(1);

      ErrorTracker.track({
        category: ErrorCategory.VALIDATION,
        statusCode: 422,
        message: 'Validation failed',
        severity: 'low',
        retriable: false,
        requestId: 'test-2',
      });

      expect(ErrorTracker.getErrorStats()['validation:422']).toBe(2);
    });
  });
});
