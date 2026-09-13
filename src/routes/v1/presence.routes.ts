import type { Application } from 'express';
import { PresenceController } from '@controllers/presence.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('PresenceRoutes');
const controller = new PresenceController();

/**
 * Presence Routes
 * /api/v1/presence/resolve - Current companion/world state (Context Engine)
 */
export function registerPresenceRoutes(app: Application): void {
  const baseRoute = '/api/v1/presence';

  // GET /api/v1/presence/resolve
  // Resolve current companion/world state for the client's video/light-state resolver
  app.get(
    `${baseRoute}/resolve`,
    authenticate,
    rateLimiters.api,
    controller.resolve
  );

  logger.info('✅ Presence routes registered');
}
