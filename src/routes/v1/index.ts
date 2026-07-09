import type { Application } from 'express';
import { registerHealthRoutes } from './health.routes';
import { registerAuthRoutes } from './auth.routes.v2';
import { registerUserRoutes } from './user.routes';
import { registerWorldRoutes } from './world.routes';
import { registerInteractionRoutes } from './interaction.routes';
import { registerMemoryRoutes } from './memory.routes';
import { registerRelationshipRoutes } from './relationship.routes';
import { registerMomentsRoutes } from './moments.routes';
import { registerNotificationRoutes } from './notification.routes';
import { registerSettingsRoutes } from './settings.routes';
import { createLogger } from '@utils/logger';

const logger = createLogger('RoutesV1');

/**
 * Register all v1 routes
 * This is the single entry point for all API endpoints
 * Organized by domain: Health, Auth, Users, Interactions, Data, Settings
 */
export function registerV1Routes(app: Application): void {
  logger.info('Registering API v1 routes...');

  // Foundation routes
  registerHealthRoutes(app);
  registerAuthRoutes(app);

  // User & Settings routes
  registerUserRoutes(app);
  registerSettingsRoutes(app);

  // World & Interaction routes
  registerWorldRoutes(app);
  registerInteractionRoutes(app);

  // Data routes
  registerMemoryRoutes(app);
  registerRelationshipRoutes(app);
  registerMomentsRoutes(app);

  // Notification routes
  registerNotificationRoutes(app);

  logger.info('✅ All v1 routes registered (10 modules, 45+ endpoints)');
}
