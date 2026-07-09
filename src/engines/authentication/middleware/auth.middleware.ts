/**
 * Authentication Middleware
 * Express middleware for token validation and context setup
 */

import { Request, Response, NextFunction } from 'express';
import { JWTValidator } from '../security/jwt.validator';
import { AuthenticationContext } from '../types';
import { createLogger } from '@utils/logger';

const logger = createLogger('AuthenticationMiddleware');
const jwtValidator = new JWTValidator();

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticationContext;
    }
  }
}

export async function authenticationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.slice(7);
    const payload = await jwtValidator.validateAccessToken(token);

    if (!payload) {
      res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Token is invalid or expired',
      });
      return;
    }

    req.auth = {
      userId: payload.userId,
      sessionId: payload.sessionId,
      deviceId: payload.deviceId,
      roles: payload.roles,
      permissions: payload.permissions,
      correlationId: payload.correlationId,
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      timestamp: new Date(),
      provider: payload.provider,
    };

    logger.debug(`Authentication context set for user ${payload.userId}`);
    next();
  } catch (error) {
    logger.error(`Authentication middleware error: ${error}`);
    res.status(500).json({
      error: 'AUTHENTICATION_ERROR',
      message: 'An error occurred during authentication',
    });
  }
}

export async function optionalAuthenticationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = await jwtValidator.validateAccessToken(token);

      if (payload) {
        req.auth = {
          userId: payload.userId,
          sessionId: payload.sessionId,
          deviceId: payload.deviceId,
          roles: payload.roles,
          permissions: payload.permissions,
          correlationId: payload.correlationId,
          ipAddress: req.ip || '',
          userAgent: req.get('user-agent') || '',
          timestamp: new Date(),
          provider: payload.provider,
        };
      }
    }

    next();
  } catch (error) {
    logger.error(`Optional authentication middleware error: ${error}`);
    next();
  }
}
