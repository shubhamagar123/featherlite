import type { Application } from 'express';
import { RelationshipController } from '@controllers/relationship.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('RelationshipRoutes');
const controller = new RelationshipController();

/**
 * Relationship Routes (Application Layer)
 * /api/v1/companions/:companionId/relationship/* - Relationship operations
 */
export function registerRelationshipRoutes(app: Application): void {
  const baseRoute = '/api/v1';

  // GET /api/v1/companions/:companionId/relationship
  // Get current relationship (requires authentication)
  app.get(
    `${baseRoute}/companions/:companionId/relationship`,
    authenticate,
    rateLimiters.api,
    controller.getCurrentRelationship
  );

  // GET /api/v1/companions/:companionId/relationship/timeline
  // Get relationship timeline (requires authentication)
  app.get(
    `${baseRoute}/companions/:companionId/relationship/timeline`,
    authenticate,
    rateLimiters.api,
    controller.getTimeline
  );

  // GET /api/v1/companions/:companionId/relationship/dimensions
  // Get relationship dimensions (requires authentication)
  app.get(
    `${baseRoute}/companions/:companionId/relationship/dimensions`,
    authenticate,
    rateLimiters.api,
    controller.getDimensions
  );

  // GET /api/v1/companions/:companionId/relationship/memories
  // Get shared memories (requires authentication)
  app.get(
    `${baseRoute}/companions/:companionId/relationship/memories`,
    authenticate,
    rateLimiters.api,
    controller.getSharedMemories
  );

  logger.info('✅ Relationship routes registered');
}
