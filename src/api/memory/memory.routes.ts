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
 * Memory API Routes
 * GET    /api/v1/memory              - List all memories for current user
 * POST   /api/v1/memory              - Create a new memory
 * GET    /api/v1/memory/:memoryId    - Get specific memory
 * PUT    /api/v1/memory/:memoryId    - Update memory
 * DELETE /api/v1/memory/:memoryId    - Delete memory
 * GET    /api/v1/memory/search       - Search memories by query
 */

const listMemoriesSchema = {
  query: commonSchemas.pagination.extend({
    type: z.enum(['fact', 'event', 'preference', 'relationship']).optional(),
    importance: z.coerce.number().int().min(0).max(10).optional(),
  }),
};

const createMemorySchema = {
  body: z.object({
    content: z.string().min(1).max(5000),
    type: z.enum(['fact', 'event', 'preference', 'relationship']),
    importance: z.number().int().min(0).max(10).default(5),
    metadata: z.record(z.unknown()).optional(),
  }),
};

const updateMemorySchema = {
  params: z.object({
    memoryId: commonSchemas.uuid,
  }),
  body: z.object({
    content: z.string().min(1).max(5000).optional(),
    importance: z.number().int().min(0).max(10).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
};

const memoryIdSchema = {
  params: z.object({
    memoryId: commonSchemas.uuid,
  }),
};

const searchMemoriesSchema = {
  query: commonSchemas.pagination.extend({
    q: z.string().min(1).max(255),
    type: z.enum(['fact', 'event', 'preference', 'relationship']).optional(),
  }),
};

export async function registerMemoryRoutes(app: Application): Promise<void> {
  const baseRoute = '/api/v1/memory';

  /**
   * GET /api/v1/memory
   * List all memories for the authenticated user with pagination
   */
  app.get(
    baseRoute,
    authenticate,
    rateLimiters.api,
    validate(listMemoriesSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { page = 1, limit = 20 } = req.query as Record<string, any>;

      try {
        // TODO: Query MemoryRepository with filters and pagination
        const memories = [
          {
            memoryId: '550e8400-e29b-41d4-a716-446655440000',
            userId,
            content: 'Sample memory',
            type: 'fact',
            importance: 7,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        res.status(200).json(
          paginatedResponse(memories, page, limit, 1, String(req.id))
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to list memories');
        throw error;
      }
    })
  );

  /**
   * POST /api/v1/memory
   * Create a new memory
   */
  app.post(
    baseRoute,
    authenticate,
    rateLimiters.api,
    validate(createMemorySchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { content, type, importance, metadata } = req.body;

      try {
        // TODO: Create memory via MemoryService
        const memoryId = `mem_${Date.now()}`;

        logger.info(
          { userId, memoryId, type, importance },
          'Memory created'
        );

        const memory = {
          memoryId,
          userId,
          content,
          type,
          importance,
          metadata: metadata || {},
          createdAt: new Date().toISOString(),
        };

        res.status(201).json(successResponse(memory, String(req.id)));
      } catch (error) {
        logger.error({ error, userId }, 'Failed to create memory');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/memory/:memoryId
   * Get a specific memory by ID
   */
  app.get(
    `${baseRoute}/:memoryId`,
    authenticate,
    rateLimiters.api,
    validate(memoryIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { memoryId } = req.params;

      try {
        // TODO: Query MemoryRepository and verify ownership
        const memory = {
          memoryId,
          userId,
          content: 'Memory content',
          type: 'fact',
          importance: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        res.status(200).json(successResponse(memory, String(req.id)));
      } catch (error) {
        logger.error({ error, userId, memoryId }, 'Failed to get memory');
        throw error;
      }
    })
  );

  /**
   * PUT /api/v1/memory/:memoryId
   * Update a memory
   */
  app.put(
    `${baseRoute}/:memoryId`,
    authenticate,
    rateLimiters.api,
    validate(updateMemorySchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { memoryId } = req.params;
      const updates = req.body;

      try {
        // TODO: Update memory via MemoryRepository
        logger.info(
          { userId, memoryId, fields: Object.keys(updates) },
          'Memory updated'
        );

        const memory = {
          memoryId,
          userId,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        res.status(200).json(successResponse(memory, String(req.id)));
      } catch (error) {
        logger.error({ error, userId, memoryId }, 'Failed to update memory');
        throw error;
      }
    })
  );

  /**
   * DELETE /api/v1/memory/:memoryId
   * Delete a memory
   */
  app.delete(
    `${baseRoute}/:memoryId`,
    authenticate,
    rateLimiters.api,
    validate(memoryIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { memoryId } = req.params;

      try {
        // TODO: Mark memory as deleted via MemoryRepository
        logger.info(
          { userId, memoryId },
          'Memory deleted'
        );

        res.status(200).json(
          successResponse(
            { success: true, message: 'Memory deleted' },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId, memoryId }, 'Failed to delete memory');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/memory/search?q=query
   * Search memories by query string
   */
  app.get(
    `${baseRoute}/search`,
    authenticate,
    rateLimiters.api,
    validate(searchMemoriesSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { q, page = 1, limit = 20 } = req.query as Record<string, any>;

      try {
        // TODO: Full-text search via MemoryService
        // Should search in memory content using database full-text search
        const results: any[] = [];

        res.status(200).json(
          paginatedResponse(results, page, limit, 0, String(req.id))
        );
      } catch (error) {
        logger.error({ error, userId, q }, 'Failed to search memories');
        throw error;
      }
    })
  );

  logger.info('✅ Memory routes registered');
}
