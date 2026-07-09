import type { Application, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticate,
  validate,
  commonSchemas,
  asyncHandler,
  rateLimiters,
} from '@middleware/index';
import { successResponse } from '@api/index';
import { logger } from '@utils/logger';

/**
 * Auth API Routes
 * POST /api/v1/auth/session - Create session from Firebase token
 * POST /api/v1/auth/logout - End session
 */

// Validation schemas
const createSessionSchema = {
  body: z.object({
    token: z.string().min(1, 'Firebase ID token required'),
  }),
};

export async function registerAuthRoutes(app: Application): Promise<void> {
  const baseRoute = '/api/v1/auth';

  /**
   * POST /api/v1/auth/session
   * Create a server session from Firebase ID token
   *
   * Client must first authenticate with Firebase to get an ID token,
   * then exchange it for a server session
   */
  app.post(
    `${baseRoute}/session`,
    rateLimiters.auth,
    validate(createSessionSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { token } = req.body;

      try {
        // TODO: Exchange Firebase token for server session
        // For now, return the token as session ID
        const sessionId = `session_${Date.now()}`;

        logger.info(
          { sessionId },
          'Session created'
        );

        res.status(201).json(
          successResponse(
            {
              sessionId,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error }, 'Failed to create session');
        throw error;
      }
    })
  );

  /**
   * POST /api/v1/auth/logout
   * End the current session
   */
  app.post(
    `${baseRoute}/logout`,
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      try {
        // TODO: Invalidate session in Redis/database
        const userId = req.user!.uid;

        logger.info({ userId }, 'User logged out');

        res.status(200).json(
          successResponse(
            { success: true, message: 'Logged out successfully' },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error }, 'Failed to logout');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user info
   */
  app.get(
    `${baseRoute}/me`,
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const user = req.user!;

      res.status(200).json(
        successResponse(
          {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            roles: (user.customClaims?.roles as string[]) || ['user'],
          },
          String(req.id)
        )
      );
    })
  );

  logger.info('✅ Auth routes registered');
}
