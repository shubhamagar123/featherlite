import type { Application } from 'express';
import { UserController } from '@controllers/user.controller';
import { UserMeController } from '@controllers/user-me.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('UserRoutes');
const controller = new UserController();
const meController = new UserMeController();

/**
 * User Routes (Application Layer)
 * /api/v1/users/profile - Get/Update user profile
 * /api/v1/users/preferences - Get/Update user preferences
 */
export function registerUserRoutes(app: Application): void {
  const baseRoute = '/api/v1/users';

  // GET /api/v1/users/profile
  // Get current user profile (requires authentication)
  app.get(
    `${baseRoute}/profile`,
    authenticate,
    rateLimiters.api,
    controller.getProfile
  );

  // PATCH /api/v1/users/profile
  // Update user profile (requires authentication)
  app.patch(
    `${baseRoute}/profile`,
    authenticate,
    rateLimiters.api,
    controller.updateProfile
  );

  // GET /api/v1/users/preferences
  // Get user preferences (requires authentication)
  app.get(
    `${baseRoute}/preferences`,
    authenticate,
    rateLimiters.api,
    controller.getPreferences
  );

  // PATCH /api/v1/users/preferences
  // Update user preferences (requires authentication)
  app.patch(
    `${baseRoute}/preferences`,
    authenticate,
    rateLimiters.api,
    controller.updatePreferences
  );

  // GET/PATCH/DELETE /api/v1/users/me
  // Profile summary (Profile screen), profile updates, full account deletion
  app.get(`${baseRoute}/me`, authenticate, rateLimiters.api, meController.getMe);
  app.patch(`${baseRoute}/me`, authenticate, rateLimiters.api, meController.updateMe);
  app.delete(`${baseRoute}/me`, authenticate, rateLimiters.api, meController.deleteMe);

  logger.info('✅ User routes registered');
}
