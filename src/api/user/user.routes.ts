import type { Application, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticate,
  validate,
  commonSchemas,
  requireOwnership,
  asyncHandler,
  rateLimiters,
} from '@middleware/index';
import { successResponse } from '@api/index';
import { logger } from '@utils/logger';

/**
 * User API Routes
 * GET    /api/v1/users/me       - Get current user profile
 * GET    /api/v1/users/:userId  - Get user public profile
 * PATCH  /api/v1/users/me       - Update current user profile
 * DELETE /api/v1/users/me       - Delete user account
 */

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    preferences: z.record(z.unknown()).optional(),
  }),
});

const userIdParamSchema = z.object({
  params: z.object({
    userId: commonSchemas.uuid,
  }),
});

export async function registerUserRoutes(app: Application): Promise<void> {
  const baseRoute = '/api/v1/users';

  /**
   * GET /api/v1/users/me
   * Get current authenticated user's full profile
   */
  app.get(
    `${baseRoute}/me`,
    authenticate,
    rateLimiters.api,
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;

      try {
        // TODO: Query UserRepository to get full profile
        const userProfile = {
          userId,
          email: req.user!.email,
          name: 'User Name',
          avatar: null,
          bio: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preferences: {
            notifications: true,
            privateProfile: false,
          },
        };

        res.status(200).json(successResponse(userProfile, String(req.id)));
      } catch (error) {
        logger.error({ error, userId }, 'Failed to get user profile');
        throw error;
      }
    })
  );

  /**
   * PATCH /api/v1/users/me
   * Update current user's profile
   */
  app.patch(
    `${baseRoute}/me`,
    authenticate,
    rateLimiters.api,
    validate(updateProfileSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { name, avatar, bio, preferences } = req.body;

      try {
        // TODO: Update UserRepository with new profile data
        logger.info(
          { userId, fields: Object.keys(req.body) },
          'User profile updated'
        );

        const updatedProfile = {
          userId,
          email: req.user!.email,
          name: name || 'User Name',
          avatar: avatar || null,
          bio: bio || null,
          updatedAt: new Date().toISOString(),
          preferences: { ...preferences },
        };

        res.status(200).json(successResponse(updatedProfile, String(req.id)));
      } catch (error) {
        logger.error({ error, userId }, 'Failed to update user profile');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/users/:userId
   * Get public profile of any user (limited data)
   */
  app.get(
    `${baseRoute}/:userId`,
    authenticate,
    rateLimiters.api,
    validate(userIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.params as { userId: string };

      try {
        // TODO: Query UserRepository for public profile
        const publicProfile = {
          userId,
          name: 'User Name',
          avatar: null,
          bio: null,
          createdAt: new Date().toISOString(),
          // Note: email, preferences not included in public profile
        };

        res.status(200).json(successResponse(publicProfile, String(req.id)));
      } catch (error) {
        logger.error({ error, userId }, 'Failed to get public profile');
        throw error;
      }
    })
  );

  /**
   * DELETE /api/v1/users/me
   * Soft-delete user account (marks as deleted, keeps data for recovery)
   */
  app.delete(
    `${baseRoute}/me`,
    authenticate,
    requireOwnership(() => undefined), // Override to use current user
    rateLimiters.api,
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;

      try {
        // TODO: Mark user as deleted in UserRepository
        logger.warn(
          { userId },
          'User account deleted'
        );

        res.status(200).json(
          successResponse(
            {
              success: true,
              message: 'Account deleted successfully',
              deletedAt: new Date().toISOString(),
            },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to delete user account');
        throw error;
      }
    })
  );

  logger.info('✅ User routes registered');
}
