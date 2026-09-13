import type { Application } from 'express';
import { BillingController } from '@controllers/billing.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('BillingRoutes');
const controller = new BillingController();

/**
 * Billing Routes
 * /api/v1/billing/status — current tier + gated features
 * /api/v1/billing/subscribe — start a subscription (mock payment provider
 * until a vendor is chosen)
 */
export function registerBillingRoutes(app: Application): void {
  const baseRoute = '/api/v1/billing';

  app.get(`${baseRoute}/status`, authenticate, rateLimiters.api, controller.status);
  app.post(`${baseRoute}/subscribe`, authenticate, rateLimiters.api, controller.subscribe);

  logger.info('✅ Billing routes registered');
}
