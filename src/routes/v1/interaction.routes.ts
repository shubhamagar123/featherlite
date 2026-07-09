import type { Application } from 'express';
import { InteractionController } from '@controllers/interaction.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('InteractionRoutes');
const controller = new InteractionController();

/**
 * Interaction Routes (Application Layer)
 * /api/v1/interactions/start - Start interaction
 * /api/v1/conversations/:id/continue - Continue interaction
 * /api/v1/conversations/:id/history - Get history
 */
export function registerInteractionRoutes(app: Application): void {
  const baseRoute = '/api/v1';

  // POST /api/v1/interactions/start
  // Start new interaction (requires authentication)
  app.post(
    `${baseRoute}/interactions/start`,
    authenticate,
    rateLimiters.api,
    controller.startInteraction
  );

  // POST /api/v1/conversations/:conversationId/continue
  // Continue existing interaction (requires authentication)
  app.post(
    `${baseRoute}/conversations/:conversationId/continue`,
    authenticate,
    rateLimiters.api,
    controller.continueInteraction
  );

  // GET /api/v1/conversations/:conversationId/history
  // Get conversation history (requires authentication)
  app.get(
    `${baseRoute}/conversations/:conversationId/history`,
    authenticate,
    rateLimiters.api,
    controller.getConversationHistory
  );

  logger.info('✅ Interaction routes registered');
}
