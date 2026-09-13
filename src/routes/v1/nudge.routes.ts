import type { Application } from 'express';
import { NudgeController } from '@controllers/nudge.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('NudgeRoutes');
const controller = new NudgeController();

/**
 * Nudge Routes
 * /api/v1/nudges/preferences - CRUD for per-user nudge delivery preferences
 */
export function registerNudgeRoutes(app: Application): void {
  const baseRoute = '/api/v1/nudges/preferences';

  app.post(baseRoute, authenticate, rateLimiters.api, controller.create);
  app.get(baseRoute, authenticate, rateLimiters.api, controller.list);
  app.get(`${baseRoute}/:id`, authenticate, rateLimiters.api, controller.getById);
  app.patch(`${baseRoute}/:id`, authenticate, rateLimiters.api, controller.update);
  app.delete(`${baseRoute}/:id`, authenticate, rateLimiters.api, controller.delete);

  logger.info('✅ Nudge routes registered');
}
