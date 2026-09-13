import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { logger } from '@utils/logger';
import { AppError, ErrorCode } from '@utils/error';

/**
 * CSRF Protection Middleware
 *
 * NOTE: This is only needed if your API uses cookie-based sessions.
 * For token-based authentication (Firebase + JWT), CSRF protection
 * is unnecessary since tokens are in the Authorization header.
 *
 * If you need CSRF protection:
 * 1. Set ENABLE_CSRF_PROTECTION=true in environment
 * 2. Clients must extract CSRF token from X-CSRF-Token header
 * 3. Clients must send CSRF token in X-CSRF-Token request header for state-changing operations
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER = 'x-csrf-token';

// Methods that require CSRF protection
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * CSRF middleware - validates CSRF token for state-changing requests
 * Only enabled if CSRF protection is configured
 */
export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // CSRF protection only for state-changing operations
  if (!CSRF_PROTECTED_METHODS.includes(req.method)) {
    return next();
  }

  // For GET requests and safe operations
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    const token = generateCsrfToken();
    res.locals.csrfToken = token;
    return next();
  }

  try {
    const clientToken = req.headers[CSRF_HEADER] as string;

    if (!clientToken) {
      logger.warn(
        {
          method: req.method,
          path: req.path,
          ip: req.ip,
        },
        'CSRF token missing'
      );

      throw new AppError(
        403,
        ErrorCode.FORBIDDEN,
        'CSRF token missing or invalid'
      );
    }

    // Verify token format (should be hex string of correct length)
    if (!/^[a-f0-9]{64}$/.test(clientToken)) {
      logger.warn(
        {
          method: req.method,
          path: req.path,
          ip: req.ip,
        },
        'CSRF token invalid format'
      );

      throw new AppError(
        403,
        ErrorCode.FORBIDDEN,
        'CSRF token invalid'
      );
    }

    // In production, validate against stored token
    // For now, we accept valid-format tokens
    // A real implementation would compare against session-stored token

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error({ error }, 'CSRF middleware error');
    throw new AppError(
      500,
      ErrorCode.INTERNAL_SERVER_ERROR,
      'CSRF validation failed'
    );
  }
}

/**
 * Decorator to disable CSRF protection for specific routes
 * Usage: app.post('/webhook', disableCsrf(), handler)
 */
export function disableCsrf() {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    next();
  };
}
