import type { Application } from 'express';
import { MemoryController } from '@controllers/memory.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('MemoryRoutes');
const controller = new MemoryController();

/**
 * Memory Routes (Application Layer)
 * /api/v1/companions/:companionId/memories/* - Memory operations
 * /api/v1/memories/:memoryId - Memory details
 */
export function registerMemoryRoutes(app: Application): void {
  const baseRoute = '/api/v1';

  // GET /api/v1/companions/:companionId/memories/search
  // Search memories (requires authentication)
  app.get(
    `${baseRoute}/companions/:companionId/memories/search`,
    authenticate,
    rateLimiters.api,
    controller.searchMemories
  );

  // GET /api/v1/companions/:companionId/memories
  // Retrieve memories (requires authentication)
  app.get(
    `${baseRoute}/companions/:companionId/memories`,
    authenticate,
    rateLimiters.api,
    controller.retrieveMemories
  );

  // GET /api/v1/companions/:companionId/memories/timeline
  // Get memory timeline (requires authentication)
  app.get(
    `${baseRoute}/companions/:companionId/memories/timeline`,
    authenticate,
    rateLimiters.api,
    controller.getTimeline
  );

  // GET /api/v1/memories/:memoryId is owned by memories.routes.ts (user-scoped,
  // ownership-checked) — not registered here to avoid a duplicate route.

  logger.info('✅ Memory routes registered');
}
