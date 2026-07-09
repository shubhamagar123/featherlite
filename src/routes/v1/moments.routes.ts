import type { Application } from 'express';
import { MomentsController } from '@controllers/moments.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('MomentsRoutes');
const controller = new MomentsController();

/**
 * Moments Routes (Application Layer)
 * /api/v1/moments/* - Moments and callbacks operations
 */
export function registerMomentsRoutes(app: Application): void {
  const baseRoute = '/api/v1/moments';

  // GET /api/v1/moments/upcoming
  // Get upcoming moments (requires authentication)
  app.get(
    `${baseRoute}/upcoming`,
    authenticate,
    rateLimiters.api,
    controller.getUpcoming
  );

  // GET /api/v1/moments/history
  // Get moment history (requires authentication)
  app.get(
    `${baseRoute}/history`,
    authenticate,
    rateLimiters.api,
    controller.getHistory
  );

  // GET /api/v1/moments/callbacks
  // Get scheduled callbacks (requires authentication)
  app.get(
    `${baseRoute}/callbacks`,
    authenticate,
    rateLimiters.api,
    controller.getCallbacks
  );

  logger.info('✅ Moments routes registered');
}
