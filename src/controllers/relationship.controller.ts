import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { RelationshipApplicationService } from '@application/services/relationship.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate, uuidSchema } from '@application/validators/application.validators';
import { asyncHandler } from '@utils/asyncHandler';
import { z } from 'zod';

/**
 * Relationship Controller
 * Handles relationship endpoints
 * IMPORTANT: No business logic here!
 */
export class RelationshipController extends ControllerBase {
  private readonly relationshipService: RelationshipApplicationService;

  constructor() {
    super('RelationshipController');
    this.relationshipService = new RelationshipApplicationService();
  }

  /**
   * GET /api/v1/companions/:companionId/relationship
   * Get current relationship
   */
  getCurrentRelationship = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/companions/:companionId/relationship', { traceId });

    try {
      const { companionId } = req.params;
      validate({ companionId }, z.object({ companionId: uuidSchema }));

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

      const relationship = await this.relationshipService.getCurrentRelationship(context, companionId);
      this.success(res, relationship, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/companions/:companionId/relationship', error, {
        traceId,
      });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/companions/:companionId/relationship/timeline
   * Get relationship timeline
   */
  getTimeline = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/companions/:companionId/relationship/timeline', { traceId });

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

      const timeline = await this.relationshipService.getRelationshipTimeline(context, companionId, limit);
      this.success(res, { timeline, count: timeline.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/companions/:companionId/relationship/timeline', error, {
        traceId,
      });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/companions/:companionId/relationship/dimensions
   * Get relationship dimensions
   */
  getDimensions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/companions/:companionId/relationship/dimensions', { traceId });

    try {
      const { companionId } = req.params;
      validate({ companionId }, z.object({ companionId: uuidSchema }));

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

      const dimensions = await this.relationshipService.getRelationshipDimensions(context, companionId);
      this.success(res, dimensions, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/companions/:companionId/relationship/dimensions', error, {
        traceId,
      });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/companions/:companionId/relationship/memories
   * Get shared memories
   */
  getSharedMemories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/companions/:companionId/relationship/memories', { traceId });

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

      const memories = await this.relationshipService.getSharedMemories(context, companionId, limit);
      this.success(res, { memories, count: memories.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/companions/:companionId/relationship/memories', error, {
        traceId,
      });
      this.error(res, error, traceId);
    }
  });
}
