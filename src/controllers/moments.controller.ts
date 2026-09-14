import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { MomentsApplicationService } from '@application/services/moments.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { asyncHandler } from '@utils/asyncHandler';

/**
 * Moments Controller
 * Handles moments and callbacks endpoints
 * IMPORTANT: No business logic here!
 */
export class MomentsController extends ControllerBase {
  private readonly momentsService: MomentsApplicationService;

  constructor() {
    super('MomentsController');
    this.momentsService = new MomentsApplicationService();
  }

  /**
   * GET /api/v1/moments/upcoming
   * Get upcoming moments
   */
  getUpcoming = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/moments/upcoming', { traceId });

    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

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

      const moments = await this.momentsService.getUpcomingMoments(context, limit);
      this.success(res, { moments, count: moments.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/moments/upcoming', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/moments/history
   * Get moment history
   */
  getHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/moments/history', { traceId });

    try {
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

      const history = await this.momentsService.getMomentHistory(context, limit);
      this.success(res, { history, count: history.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/moments/history', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/moments/callbacks
   * Get scheduled callbacks
   */
  getCallbacks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/moments/callbacks', { traceId });

    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

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

      const callbacks = await this.momentsService.getScheduledCallbacks(context, limit);
      this.success(res, { callbacks, count: callbacks.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/moments/callbacks', error, { traceId });
      this.error(res, error, traceId);
    }
  });
}
