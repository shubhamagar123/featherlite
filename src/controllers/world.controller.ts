import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { WorldApplicationService } from '@application/services/world.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { asyncHandler } from '@api/index';

/**
 * World Controller
 * Handles world state endpoints
 * IMPORTANT: No business logic here!
 */
export class WorldController extends ControllerBase {
  private readonly worldService: WorldApplicationService;

  constructor() {
    super('WorldController');
    this.worldService = new WorldApplicationService();
  }

  /**
   * GET /api/v1/world
   * Get current world state
   */
  getCurrentWorld = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/world', { traceId });

    try {
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

      const world = await this.worldService.getCurrentWorld(context);
      this.success(res, world, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/world', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * POST /api/v1/world/refresh
   * Refresh world state
   */
  refreshWorld = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('POST', '/api/v1/world/refresh', { traceId });

    try {
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

      const world = await this.worldService.refreshWorld(context);
      this.success(res, world, traceId);
    } catch (error) {
      this.logRequestError('POST', '/api/v1/world/refresh', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/world/scene
   * Get current scene
   */
  getCurrentScene = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/world/scene', { traceId });

    try {
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

      const scene = await this.worldService.getCurrentScene(context);
      this.success(res, scene, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/world/scene', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/world/today
   * Get today's world context
   */
  getTodayWorld = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/world/today', { traceId });

    try {
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

      const today = await this.worldService.getTodayWorld(context);
      this.success(res, today, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/world/today', error, { traceId });
      this.error(res, error, traceId);
    }
  });
}
