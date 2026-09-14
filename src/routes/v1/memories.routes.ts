import type { Application } from 'express';
import { MemoriesController } from '@controllers/memories.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('MemoriesRoutes');
const controller = new MemoriesController();

/**
 * Memories Routes (user-scoped)
 * /api/v1/memories — list consented memories (Memories timeline)
 * /api/v1/memories/:id — detail / soft-delete ("forget this")
 */
export function registerMemoriesRoutes(app: Application): void {
  const baseRoute = '/api/v1/memories';

  app.get(baseRoute, authenticate, rateLimiters.api, controller.list);
  app.get(`${baseRoute}/:id`, authenticate, rateLimiters.api, controller.getById);
  app.delete(`${baseRoute}/:id`, authenticate, rateLimiters.api, controller.forget);

  logger.info('✅ Memories routes registered');
}
