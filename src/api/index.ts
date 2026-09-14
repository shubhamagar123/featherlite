import type { Application } from 'express';
import { logger } from '@utils/logger';
import { registerAuthRoutes } from './auth/auth.routes';
import { registerUserRoutes } from './user/user.routes';
import { registerCompanionRoutes } from './companion/companion.routes';
import { registerConversationRoutes } from './conversation/conversation.routes';
import { registerMemoryRoutes } from './memory/memory.routes';
import { registerRelationshipRoutes } from './relationship/relationship.routes';
import { registerNotificationRoutes } from './notification/notification.routes';
import { registerMomentRoutes } from './moment/moment.routes';
import { serveOpenApiSpec } from './openapi';
import { registerV1Routes } from '@routes/v1';

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

  try {
    // Register V1 routes (new application layer)
    registerV1Routes(app);

    // Register legacy route modules in order
    await registerAuthRoutes(app);
    await registerUserRoutes(app);
    await registerCompanionRoutes(app);
    await registerConversationRoutes(app);
    await registerMemoryRoutes(app);
    await registerRelationshipRoutes(app);
    await registerNotificationRoutes(app);
    await registerMomentRoutes(app);

    // Serve OpenAPI documentation
    serveOpenApiSpec(app);
    logger.info('✅ OpenAPI documentation available at /api/v1/docs');

    logger.info('✅ All API routes mounted successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to mount API routes');
    throw error;
  }
}

/**
 * Helper: wraps async route handlers to catch errors
 * Usage:
 * app.get('/endpoint', authenticate, validate(...), asyncHandler(async (req, res) => {...}))
 */
export { asyncHandler } from '@utils/asyncHandler';

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
