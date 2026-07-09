import type { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { logger } from '@utils/logger';
import { AppError, ErrorCode } from '@utils/error';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        emailVerified: boolean;
        customClaims?: Record<string, unknown>;
      };
    }
  }
}

/**
 * Authenticate middleware: verifies Firebase ID token from Authorization header
 * Token format: "Bearer <idToken>"
 *
 * On success: sets req.user with Firebase user info
 * On failure: returns 401 Unauthorized
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(
        ErrorCode.UNAUTHENTICATED,
        'Missing Authorization header',
        401
      );
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError(
        ErrorCode.UNAUTHENTICATED,
        'Invalid Authorization header format. Expected: Bearer <token>',
        401
      );
    }

    const idToken = parts[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Set user info on request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified ?? false,
        customClaims: decodedToken.customClaims,
      };

      logger.debug(
        { uid: decodedToken.uid, email: decodedToken.email },
        'User authenticated'
      );

      next();
    } catch (error) {
      if (error instanceof admin.auth.AuthError) {
        throw new AppError(
          ErrorCode.INVALID_TOKEN,
          'Invalid or expired authentication token',
          401,
          { originalError: error.message }
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error({ error }, 'Authentication error');
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Authentication failed',
      500
    );
  }
}

/**
 * Optional decorator for marking routes as public (no auth required)
 * Usage: app.get('/public-route', publicRoute(), handler)
 */
export function publicRoute(): (req: Request, res: Response, next: NextFunction) => void {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}
