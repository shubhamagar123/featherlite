import type { Application } from 'express';
import { ConversationController } from '@controllers/conversation.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('ConversationRoutes');
const controller = new ConversationController();

/**
 * Conversation Routes
 * /api/v1/conversations/:id/messages - Send a message (Conversation Engine)
 * /api/v1/conversations/:id/events   - Live conversation state (SSE)
 */
export function registerConversationV1Routes(app: Application): void {
  const baseRoute = '/api/v1/conversations';

  // POST /api/v1/conversations
  // Start a new conversation, returns its id
  app.post(baseRoute, authenticate, rateLimiters.api, controller.startConversation);

  // GET /api/v1/conversations/:id/messages
  // Paginated message history
  app.get(
    `${baseRoute}/:id/messages`,
    authenticate,
    rateLimiters.api,
    controller.getMessages
  );

  // POST /api/v1/conversations/:id/messages
  // Send a message on an existing conversation (delegates to Conversation Engine)
  app.post(
    `${baseRoute}/:id/messages`,
    authenticate,
    rateLimiters.chat,
    controller.sendMessage
  );

  // GET /api/v1/conversations/:id/events
  // Live conversation state stream (SSE): kai:speaking_start,
  // kai:speaking_end, video:state_change
  app.get(
    `${baseRoute}/:id/events`,
    authenticate,
    controller.streamEvents
  );

  logger.info('✅ Conversation (v1) routes registered');
}
