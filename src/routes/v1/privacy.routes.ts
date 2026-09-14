import type { Application } from 'express';
import { PrivacyController } from '@controllers/privacy.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('PrivacyRoutes');
const controller = new PrivacyController();

/**
 * Privacy Routes
 * /api/v1/privacy/export — full data export (memories, messages, planner
 * events) for the privacy screen.
 */
export function registerPrivacyRoutes(app: Application): void {
  app.get('/api/v1/privacy/export', authenticate, rateLimiters.api, controller.export);

  logger.info('✅ Privacy routes registered');
}
