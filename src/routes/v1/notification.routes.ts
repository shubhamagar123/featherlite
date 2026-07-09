import type { Application } from 'express';
import { NotificationController } from '@controllers/notification.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('NotificationRoutes');
const controller = new NotificationController();

/**
 * Notification Routes (Application Layer)
 * /api/v1/notifications/* - Notification operations
 */
export function registerNotificationRoutes(app: Application): void {
  const baseRoute = '/api/v1/notifications';

  // GET /api/v1/notifications/preferences
  // Get notification preferences (requires authentication)
  app.get(
    `${baseRoute}/preferences`,
    authenticate,
    rateLimiters.api,
    controller.getPreferences
  );

  // PATCH /api/v1/notifications/preferences
  // Update notification preferences (requires authentication)
  app.patch(
    `${baseRoute}/preferences`,
    authenticate,
    rateLimiters.api,
    controller.updatePreferences
  );

  // GET /api/v1/notifications/history
  // Get notification history (requires authentication)
  app.get(
    `${baseRoute}/history`,
    authenticate,
    rateLimiters.api,
    controller.getHistory
  );

  // POST /api/v1/notifications/tokens
  // Register push token (requires authentication)
  app.post(
    `${baseRoute}/tokens`,
    authenticate,
    rateLimiters.api,
    controller.registerToken
  );

  // PATCH /api/v1/notifications/:notificationId/read
  // Mark notification as read (requires authentication)
  app.patch(
    `${baseRoute}/:notificationId/read`,
    authenticate,
    rateLimiters.api,
    controller.markAsRead
  );

  logger.info('✅ Notification routes registered');
}
