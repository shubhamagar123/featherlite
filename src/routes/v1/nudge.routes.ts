import type { Application } from 'express';
import { NudgeController } from '@controllers/nudge.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('NudgeRoutes');
const controller = new NudgeController();

/**
 * Nudge Routes
 * /api/v1/nudges/preferences — get/update the current user's per-category
 * nudge toggle state (care_hydration, people_to_remember, checking_in).
 */
export function registerNudgeRoutes(app: Application): void {
  const baseRoute = '/api/v1/nudges/preferences';

  app.get(baseRoute, authenticate, rateLimiters.api, controller.get);
  app.patch(baseRoute, authenticate, rateLimiters.api, controller.update);

  logger.info('✅ Nudge routes registered');
}
