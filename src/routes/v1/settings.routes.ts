import type { Application } from 'express';
import { SettingsController } from '@controllers/settings.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('SettingsRoutes');
const controller = new SettingsController();

/**
 * Settings Routes (Application Layer)
 * /api/v1/settings/* - Settings operations
 */
export function registerSettingsRoutes(app: Application): void {
  const baseRoute = '/api/v1/settings';

  // GET /api/v1/settings
  // Get all settings (requires authentication)
  app.get(
    baseRoute,
    authenticate,
    rateLimiters.api,
    controller.getAllSettings
  );

  // PATCH /api/v1/settings/general
  // Update general settings (requires authentication)
  app.patch(
    `${baseRoute}/general`,
    authenticate,
    rateLimiters.api,
    controller.updateGeneral
  );

  // PATCH /api/v1/settings/privacy
  // Update privacy settings (requires authentication)
  app.patch(
    `${baseRoute}/privacy`,
    authenticate,
    rateLimiters.api,
    controller.updatePrivacy
  );

  // PATCH /api/v1/settings/notifications
  // Update notification settings (requires authentication)
  app.patch(
    `${baseRoute}/notifications`,
    authenticate,
    rateLimiters.api,
    controller.updateNotifications
  );

  // PATCH /api/v1/settings/companion
  // Update companion settings (requires authentication)
  app.patch(
    `${baseRoute}/companion`,
    authenticate,
    rateLimiters.api,
    controller.updateCompanion
  );

  logger.info('✅ Settings routes registered');
}
