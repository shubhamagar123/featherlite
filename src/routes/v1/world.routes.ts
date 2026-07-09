import type { Application } from 'express';
import { WorldController } from '@controllers/world.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('WorldRoutes');
const controller = new WorldController();

/**
 * World Routes (Application Layer)
 * /api/v1/world - Get current world
 * /api/v1/world/refresh - Refresh world
 * /api/v1/world/scene - Get current scene
 * /api/v1/world/today - Get today's world
 */
export function registerWorldRoutes(app: Application): void {
  const baseRoute = '/api/v1/world';

  // GET /api/v1/world
  // Get current world state (requires authentication)
  app.get(
    baseRoute,
    authenticate,
    rateLimiters.api,
    controller.getCurrentWorld
  );

  // POST /api/v1/world/refresh
  // Refresh world state (requires authentication)
  app.post(
    `${baseRoute}/refresh`,
    authenticate,
    rateLimiters.api,
    controller.refreshWorld
  );

  // GET /api/v1/world/scene
  // Get current scene (requires authentication)
  app.get(
    `${baseRoute}/scene`,
    authenticate,
    rateLimiters.api,
    controller.getCurrentScene
  );

  // GET /api/v1/world/today
  // Get today's world context (requires authentication)
  app.get(
    `${baseRoute}/today`,
    authenticate,
    rateLimiters.api,
    controller.getTodayWorld
  );

  logger.info('✅ World routes registered');
}
