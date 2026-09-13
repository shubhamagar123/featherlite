import type { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { FirebaseAuthError } from 'firebase-admin/auth';
import { logger } from '@utils/logger';
import { AppError, ErrorCode } from '@utils/error';
import { getRedisClient } from '@infra/redis/redis.provider';

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
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(
        401,
        ErrorCode.UNAUTHENTICATED,
        'Missing Authorization header'
      );
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError(
        401,
        ErrorCode.UNAUTHENTICATED,
        'Invalid Authorization header format. Expected: Bearer <token>'
      );
    }

    const idToken = parts[1];

    // Test-only bypass, mirroring the stub-Redis-client pattern in
    // redis.provider.ts: lets integration tests exercise real routes without
    // a live Firebase project. Requires NODE_ENV=test (never set in
    // production) AND an explicit x-test-user-id header — a request with
    // neither still goes through real Firebase verification.
    if (process.env.NODE_ENV === 'test') {
      const testUserId = req.headers['x-test-user-id'];
      if (testUserId) {
        req.user = {
          uid: String(testUserId),
          email: 'test@example.com',
          emailVerified: true,
          customClaims: {},
        };
        next();
        return;
      }
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Check if session has been invalidated (user logged out)
      const redis = getRedisClient();
      const sessionKey = `session:${decodedToken.uid}`;
      const sessionStatus = await redis.get(sessionKey);

      if (sessionStatus === 'INVALIDATED') {
        throw new AppError(
          401,
          ErrorCode.UNAUTHENTICATED,
          'Session has been invalidated. Please log in again.'
        );
      }

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
      if (error instanceof FirebaseAuthError) {
        throw new AppError(
          401,
          ErrorCode.INVALID_TOKEN,
          'Invalid or expired authentication token',
          { originalError: error.message }
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    logger.error({ error }, 'Authentication error');
    next(
      new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Authentication failed')
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
