import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { MemoryApplicationService } from '@application/services/memory.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate, uuidSchema } from '@application/validators/application.validators';
import { asyncHandler } from '@api/index';
import { z } from 'zod';

/**
 * Memory Controller
 * Handles memory endpoints
 * IMPORTANT: No business logic here!
 */
export class MemoryController extends ControllerBase {
  private readonly memoryService: MemoryApplicationService;

  constructor() {
    super('MemoryController');
    this.memoryService = new MemoryApplicationService();
  }

  /**
   * GET /api/v1/companions/:companionId/memories/search
   * Search memories
   */
  searchMemories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/companions/:companionId/memories/search', { traceId });

    try {
      const { companionId } = req.params;
      validate({ companionId }, z.object({ companionId: uuidSchema }));

      const query = req.query.q as string || '';
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

      const user = (req.user as any);
      if (!user) {
        this.error(res, new Error('UNAUTHENTICATED'), traceId);
        return;
      }

      const context: ApplicationContext = {
        userId: user.uid,
        userEmail: user.email,
        userRoles: user.customClaims?.roles || [],
        requestId: traceId,
        traceId,
        timestamp: new Date(),
      };

      const memories = await this.memoryService.searchMemories(context, companionId, query, limit);
      this.success(res, { memories, count: memories.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/companions/:companionId/memories/search', error, {
        traceId,
      });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/companions/:companionId/memories
   * Retrieve memories
   */
  retrieveMemories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/companions/:companionId/memories', { traceId });

    try {
      const { companionId } = req.params;
      validate({ companionId }, z.object({ companionId: uuidSchema }));

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

      const user = (req.user as any);
      if (!user) {
        this.error(res, new Error('UNAUTHENTICATED'), traceId);
        return;
      }

      const context: ApplicationContext = {
        userId: user.uid,
        userEmail: user.email,
        userRoles: user.customClaims?.roles || [],
        requestId: traceId,
        traceId,
        timestamp: new Date(),
      };

      const memories = await this.memoryService.retrieveMemories(context, companionId, {}, limit);
      this.success(res, { memories, count: memories.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/companions/:companionId/memories', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/companions/:companionId/memories/timeline
   * Get memory timeline
   */
  getTimeline = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/companions/:companionId/memories/timeline', { traceId });

    try {
      const { companionId } = req.params;
      validate({ companionId }, z.object({ companionId: uuidSchema }));

      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

      const user = (req.user as any);
      if (!user) {
        this.error(res, new Error('UNAUTHENTICATED'), traceId);
        return;
      }

      const context: ApplicationContext = {
        userId: user.uid,
        userEmail: user.email,
        userRoles: user.customClaims?.roles || [],
        requestId: traceId,
        traceId,
        timestamp: new Date(),
      };

      const timeline = await this.memoryService.getMemoryTimeline(context, companionId, limit);
      this.success(res, { timeline, count: timeline.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/companions/:companionId/memories/timeline', error, {
        traceId,
      });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/memories/:memoryId
   * Get memory details
   */
  getDetails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/memories/:memoryId', { traceId });

    try {
      const { memoryId } = req.params;
      validate({ memoryId }, z.object({ memoryId: uuidSchema }));

      const user = (req.user as any);
      if (!user) {
        this.error(res, new Error('UNAUTHENTICATED'), traceId);
        return;
      }

      const context: ApplicationContext = {
        userId: user.uid,
        userEmail: user.email,
        userRoles: user.customClaims?.roles || [],
        requestId: traceId,
        traceId,
        timestamp: new Date(),
      };

      const memory = await this.memoryService.getMemoryDetails(context, memoryId);
      this.success(res, memory, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/memories/:memoryId', error, { traceId });
      this.error(res, error, traceId);
    }
  });
}
