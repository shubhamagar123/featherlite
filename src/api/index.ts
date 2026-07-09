import type { Application } from 'express';
import { logger } from '@utils/logger';

/**
 * Route registry for API modules
 * Each module implements registerRoutes() to register its endpoints
 */

export interface IRouteModule {
  registerRoutes(app: Application): Promise<void> | void;
}

/**
 * Mount all API routes
 * Routes are organized by module, all under /api/v1 prefix
 */
export async function mountApi(app: Application): Promise<void> {
  logger.info('🚀 Mounting API routes...');

  // Dynamic module loading will happen here
  // For now, we'll import modules as they're implemented

  // TODO: Import and register each module
  // import { registerAuthRoutes } from './auth';
  // import { registerUserRoutes } from './user';
  // import { registerCompanionRoutes } from './companion';
  // etc.

  logger.info('✅ API routes mounted');
}

/**
 * Helper: wraps async route handlers to catch errors
 * Usage:
 * app.get('/endpoint', authenticate, validate(...), asyncHandler(async (req, res) => {...}))
 */
export function asyncHandler(
  fn: (req: any, res: any, next?: any) => Promise<any>
) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * API Response wrapper for consistent response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  requestId: string;
}

/**
 * Helper: create standardized success response
 */
export function successResponse<T>(
  data: T,
  requestId: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Helper: create paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  requestId: string
): ApiResponse<PaginatedResponse<T>> {
  return successResponse(
    {
      items,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    },
    requestId
  );
}
