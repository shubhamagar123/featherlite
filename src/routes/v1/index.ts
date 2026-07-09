import type { Application } from 'express';
import { registerHealthRoutes } from './health.routes';
import { registerAuthRoutes } from './auth.routes.v2';
import { createLogger } from '@utils/logger';

const logger = createLogger('RoutesV1');

/**
 * Register all v1 routes
 * This is the single entry point for all API endpoints
 */
export function registerV1Routes(app: Application): void {
  logger.info('Registering API v1 routes...');

  // Health routes
  registerHealthRoutes(app);

  // Auth routes
  registerAuthRoutes(app);

  // TODO: Add other route groups
  // - Users
  // - Memories
  // - Relationships
  // - Interactions
  // - Moments
  // - Notifications
  // - Settings
  // - Admin

  logger.info('✅ All v1 routes registered');
}
