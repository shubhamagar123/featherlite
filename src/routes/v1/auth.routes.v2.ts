import type { Application } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { authenticate, rateLimiters } from '@middleware/index';
import { createLogger } from '@utils/logger';

const logger = createLogger('AuthRoutes');

const controller = new AuthController();

/**
 * Auth Routes (Application Layer)
 * /api/v1/auth/session - Create session
 * /api/v1/auth/logout - End session
 * /api/v1/auth/me - Get current user
 * /api/v1/auth/refresh - Refresh token
 */
export function registerAuthRoutes(app: Application): void {
  const baseRoute = '/api/v1/auth';

  // POST /api/v1/auth/session
  // Create session from Firebase token
  app.post(
    `${baseRoute}/session`,
    rateLimiters.auth,
    authenticate,
    controller.createSession
  );

  // POST /api/v1/auth/logout
  // End session (requires authentication)
  app.post(
    `${baseRoute}/logout`,
    authenticate,
    rateLimiters.api,
    controller.logout
  );

  // GET /api/v1/auth/me
  // Get current user profile (requires authentication)
  app.get(
    `${baseRoute}/me`,
    authenticate,
    rateLimiters.api,
    controller.getCurrentUser
  );

  // POST /api/v1/auth/refresh
  // Refresh access token (requires authentication)
  app.post(
    `${baseRoute}/refresh`,
    authenticate,
    rateLimiters.api,
    controller.refreshToken
  );

  logger.info('✅ Auth routes registered');
}
