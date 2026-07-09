import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '@utils/error';
import { logger } from '@utils/logger';

export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * Authorize middleware: checks if user has required roles
 * Must be used after authenticate() middleware
 *
 * Usage: app.get('/admin-route', authenticate, authorize('admin'), handler)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(
        ErrorCode.UNAUTHENTICATED,
        'User authentication required',
        401
      );
    }

    const userRoles = (req.user.customClaims?.roles as string[]) || ['user'];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      logger.warn(
        {
          uid: req.user.uid,
          requiredRoles: allowedRoles,
          userRoles,
          path: req.path,
          method: req.method,
        },
        'Authorization failed: insufficient permissions'
      );

      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Insufficient permissions for this operation',
        403
      );
    }

    logger.debug(
      { uid: req.user.uid, userRoles, requiredRoles: allowedRoles },
      'Authorization check passed'
    );

    next();
  };
}

/**
 * Ownership middleware: verifies user owns the specified resource
 * Calls getResourceOwnerId to extract owner ID from request
 *
 * Usage:
 * app.get('/users/:userId/profile',
 *   authenticate,
 *   requireOwnership((req) => req.params.userId),
 *   handler
 * )
 */
export function requireOwnership(
  getResourceOwnerId: (req: Request) => string | undefined
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(
        ErrorCode.UNAUTHENTICATED,
        'User authentication required',
        401
      );
    }

    const resourceOwnerId = getResourceOwnerId(req);

    if (!resourceOwnerId) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        'Could not determine resource owner',
        400
      );
    }

    if (req.user.uid !== resourceOwnerId) {
      logger.warn(
        {
          uid: req.user.uid,
          resourceOwnerId,
          path: req.path,
          method: req.method,
        },
        'Ownership check failed'
      );

      throw new AppError(
        ErrorCode.FORBIDDEN,
        'You do not have permission to access this resource',
        403
      );
    }

    logger.debug(
      { uid: req.user.uid, resourceOwnerId },
      'Ownership check passed'
    );

    next();
  };
}
