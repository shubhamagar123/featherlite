import type { Application } from 'express';
import { PlannerController } from '@controllers/planner.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('PlannerRoutes');
const controller = new PlannerController();

/**
 * Planner Routes
 * /api/v1/planner/events - CRUD for user-scheduled planner events
 */
export function registerPlannerRoutes(app: Application): void {
  const baseRoute = '/api/v1/planner/events';

  app.post(baseRoute, authenticate, rateLimiters.api, controller.create);
  app.get(baseRoute, authenticate, rateLimiters.api, controller.list);
  app.get(`${baseRoute}/:id`, authenticate, rateLimiters.api, controller.getById);
  app.patch(`${baseRoute}/:id`, authenticate, rateLimiters.api, controller.update);
  app.delete(`${baseRoute}/:id`, authenticate, rateLimiters.api, controller.delete);

  logger.info('✅ Planner routes registered');
}
