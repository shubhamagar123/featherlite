/**
 * Authorization Middleware
 * Express middleware for permission and role enforcement
 */

import { Request, Response, NextFunction } from 'express';
import { PermissionEvaluator } from '../security/permission.evaluator';
import { UserRole, PermissionType } from '../types';
import { createLogger } from '@utils/logger';

const logger = createLogger('AuthorizationMiddleware');
const permissionEvaluator = new PermissionEvaluator();

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (!permissionEvaluator.hasAnyRole(req.auth, roles)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Required roles: ${roles.join(', ')}`,
      });
      return;
    }

    logger.debug(`User ${req.auth.userId} authorized for roles ${roles.join(', ')}`);
    next();
  };
}

export function requirePermission(...permissions: PermissionType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (!permissionEvaluator.hasAnyPermission(req.auth, permissions)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Required permissions: ${permissions.join(', ')}`,
      });
      return;
    }

    logger.debug(`User ${req.auth.userId} authorized for permissions ${permissions.join(', ')}`);
    next();
  };
}

export function requireAllPermissions(...permissions: PermissionType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (!permissionEvaluator.hasAllPermissions(req.auth, permissions)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Required permissions: ${permissions.join(', ')}`,
      });
      return;
    }

    logger.debug(`User ${req.auth.userId} authorized for all permissions ${permissions.join(', ')}`);
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }

  if (!req.auth.roles.includes(UserRole.ADMIN)) {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Admin role required',
    });
    return;
  }

  logger.debug(`Admin user ${req.auth.userId} authorized`);
  next();
}

export function requireDeveloper(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }

  if (!req.auth.roles.includes(UserRole.DEVELOPER) && !req.auth.roles.includes(UserRole.ADMIN)) {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Developer role required',
    });
    return;
  }

  logger.debug(`Developer user ${req.auth.userId} authorized`);
  next();
}
