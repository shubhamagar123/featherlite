import type { Application, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticate,
  validate,
  commonSchemas,
  asyncHandler,
  rateLimiters,
} from '@middleware/index';
import { successResponse, paginatedResponse } from '@api/index';
import { logger } from '@utils/logger';

/**
 * Companion API Routes
 * GET    /api/v1/companion              - List all companions for current user
 * POST   /api/v1/companion              - Create new companion
 * GET    /api/v1/companion/:companionId - Get companion details
 * PUT    /api/v1/companion/:companionId - Update companion
 * DELETE /api/v1/companion/:companionId - Delete companion
 * POST   /api/v1/companion/:companionId/activate   - Activate companion
 * POST   /api/v1/companion/:companionId/deactivate - Deactivate companion
 */

const listCompanionsSchema = {
  query: commonSchemas.pagination.extend({
    status: z.enum(['active', 'inactive', 'archived']).optional(),
  }),
};

const createCompanionSchema = {
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    avatar: z.string().url().optional(),
    personality: z.record(z.unknown()).optional(),
    config: z.record(z.unknown()).optional(),
  }),
};

const updateCompanionSchema = {
  params: z.object({
    companionId: commonSchemas.uuid,
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    avatar: z.string().url().optional(),
    personality: z.record(z.unknown()).optional(),
    config: z.record(z.unknown()).optional(),
  }),
};

const companionIdSchema = {
  params: z.object({
    companionId: commonSchemas.uuid,
  }),
};

export async function registerCompanionRoutes(app: Application): Promise<void> {
  const baseRoute = '/api/v1/companion';

  /**
   * GET /api/v1/companion
   * List all companions for the authenticated user
   */
  app.get(
    baseRoute,
    authenticate,
    rateLimiters.api,
    validate(listCompanionsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { page = 1, limit = 20 } = req.query as Record<string, any>;

      try {
        // TODO: Query CompanionRepository with pagination
        const companions = [
          {
            companionId: '550e8400-e29b-41d4-a716-446655440000',
            userId,
            name: 'Companion Name',
            description: 'A wonderful companion',
            avatar: null,
            status: 'active',
            createdAt: new Date().toISOString(),
          },
        ];

        res.status(200).json(
          paginatedResponse(companions, page, limit, 1, String(req.id))
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to list companions');
        throw error;
      }
    })
  );

  /**
   * POST /api/v1/companion
   * Create a new companion
   */
  app.post(
    baseRoute,
    authenticate,
    rateLimiters.api,
    validate(createCompanionSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { name, description, avatar, personality, config } = req.body;

      try {
        // TODO: Create companion via CompanionService
        const companionId = `cmp_${Date.now()}`;

        logger.info(
          { userId, companionId, name },
          'Companion created'
        );

        const companion = {
          companionId,
          userId,
          name,
          description: description || null,
          avatar: avatar || null,
          personality: personality || {},
          config: config || {},
          status: 'inactive',
          createdAt: new Date().toISOString(),
        };

        res.status(201).json(successResponse(companion, String(req.id)));
      } catch (error) {
        logger.error({ error, userId }, 'Failed to create companion');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/companion/:companionId
   * Get companion details
   */
  app.get(
    `${baseRoute}/:companionId`,
    authenticate,
    rateLimiters.api,
    validate(companionIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { companionId } = req.params;

      try {
        // TODO: Query CompanionRepository and verify ownership
        const companion = {
          companionId,
          userId,
          name: 'Companion Name',
          description: 'Description',
          avatar: null,
          personality: {},
          config: {},
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        res.status(200).json(successResponse(companion, String(req.id)));
      } catch (error) {
        logger.error({ error, userId, companionId }, 'Failed to get companion');
        throw error;
      }
    })
  );

  /**
   * PUT /api/v1/companion/:companionId
   * Update companion
   */
  app.put(
    `${baseRoute}/:companionId`,
    authenticate,
    rateLimiters.api,
    validate(updateCompanionSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { companionId } = req.params;
      const updates = req.body;

      try {
        // TODO: Update companion via CompanionRepository
        logger.info(
          { userId, companionId, fields: Object.keys(updates) },
          'Companion updated'
        );

        const companion = {
          companionId,
          userId,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        res.status(200).json(successResponse(companion, String(req.id)));
      } catch (error) {
        logger.error({ error, userId, companionId }, 'Failed to update companion');
        throw error;
      }
    })
  );

  /**
   * DELETE /api/v1/companion/:companionId
   * Delete companion
   */
  app.delete(
    `${baseRoute}/:companionId`,
    authenticate,
    rateLimiters.api,
    validate(companionIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { companionId } = req.params;

      try {
        // TODO: Soft-delete companion via CompanionRepository
        logger.info(
          { userId, companionId },
          'Companion deleted'
        );

        res.status(200).json(
          successResponse(
            { success: true, message: 'Companion deleted' },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId, companionId }, 'Failed to delete companion');
        throw error;
      }
    })
  );

  /**
   * POST /api/v1/companion/:companionId/activate
   * Activate a companion for use
   */
  app.post(
    `${baseRoute}/:companionId/activate`,
    authenticate,
    rateLimiters.api,
    validate(companionIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { companionId } = req.params;

      try {
        // TODO: Set companion status to active
        logger.info(
          { userId, companionId },
          'Companion activated'
        );

        res.status(200).json(
          successResponse(
            { success: true, status: 'active' },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId, companionId }, 'Failed to activate companion');
        throw error;
      }
    })
  );

  /**
   * POST /api/v1/companion/:companionId/deactivate
   * Deactivate a companion
   */
  app.post(
    `${baseRoute}/:companionId/deactivate`,
    authenticate,
    rateLimiters.api,
    validate(companionIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { companionId } = req.params;

      try {
        // TODO: Set companion status to inactive
        logger.info(
          { userId, companionId },
          'Companion deactivated'
        );

        res.status(200).json(
          successResponse(
            { success: true, status: 'inactive' },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId, companionId }, 'Failed to deactivate companion');
        throw error;
      }
    })
  );

  logger.info('✅ Companion routes registered');
}
