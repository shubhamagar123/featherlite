import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { environment } from '@config/environment';
import { AppError, ErrorCode } from '@utils/error';
import { logger } from '@utils/logger';

// Extend Express Request for admin context
declare global {
  namespace Express {
    interface Request {
      admin?: {
        service: string;
        role: string;
        issuedAt: number;
      };
    }
  }
}

/**
 * Admin JWT authentication for internal staff dashboards
 * Uses internal JWT_SECRET (not Firebase tokens)
 *
 * Token format: "Bearer <jwt>"
 * Token should contain: { service, role, iat }
 */
export async function adminAuth(
  req: Request,
  res: Response,
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
        'Invalid Authorization header format'
      );
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, environment.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as {
        service: string;
        role: string;
        iat: number;
      };

      // Validate required fields
      if (!decoded.service || !decoded.role) {
        throw new AppError(
          401,
          ErrorCode.INVALID_TOKEN,
          'Invalid token payload'
        );
      }

      req.admin = {
        service: decoded.service,
        role: decoded.role,
        issuedAt: decoded.iat,
      };

      logger.debug(
        { service: decoded.service, role: decoded.role },
        'Admin authenticated'
      );

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(
          401,
          ErrorCode.INVALID_TOKEN,
          'Invalid or expired admin token'
        );
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          401,
          ErrorCode.TOKEN_EXPIRED,
          'Admin token has expired'
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error({ error }, 'Admin authentication error');
    throw new AppError(
      500,
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Authentication failed'
    );
  }
}

/**
 * Generate admin JWT token for internal services
 * Valid for 24 hours
 */
export function generateAdminToken(
  service: string,
  role: 'admin' | 'moderator' | 'viewer'
): string {
  return jwt.sign(
    {
      service,
      role,
      iat: Math.floor(Date.now() / 1000),
    },
    environment.JWT_SECRET,
    {
      expiresIn: '24h',
      algorithm: 'HS256',
    }
  );
}
