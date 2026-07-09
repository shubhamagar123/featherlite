import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { NotificationApplicationService } from '@application/services/notification.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate, uuidSchema } from '@application/validators/application.validators';
import { asyncHandler } from '@api/index';
import { z } from 'zod';

/**
 * Notification Controller
 * Handles notification endpoints
 * IMPORTANT: No business logic here!
 */
export class NotificationController extends ControllerBase {
  private readonly notificationService: NotificationApplicationService;

  constructor() {
    super('NotificationController');
    this.notificationService = new NotificationApplicationService();
  }

  /**
   * GET /api/v1/notifications/preferences
   * Get notification preferences
   */
  getPreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/notifications/preferences', { traceId });

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

      const preferences = await this.notificationService.getPreferences(context);
      this.success(res, preferences, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/notifications/preferences', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * PATCH /api/v1/notifications/preferences
   * Update notification preferences
   */
  updatePreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('PATCH', '/api/v1/notifications/preferences', { traceId });

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

      const preferences = await this.notificationService.updatePreferences(context, req.body);
      this.success(res, preferences, traceId);
    } catch (error) {
      this.logRequestError('PATCH', '/api/v1/notifications/preferences', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/notifications/history
   * Get notification history
   */
  getHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/notifications/history', { traceId });

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

      const history = await this.notificationService.getHistory(context, limit);
      this.success(res, { notifications: history, count: history.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/notifications/history', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * POST /api/v1/notifications/tokens
   * Register push token
   */
  registerToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('POST', '/api/v1/notifications/tokens', { traceId });

    try {
      const schema = z.object({
        token: z.string().min(1),
        platform: z.string().default('web'),
      });
      const { token, platform } = validate(req.body, schema);

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

      const result = await this.notificationService.registerPushToken(context, token, platform);
      this.success(res, result, traceId, 201);
    } catch (error) {
      this.logRequestError('POST', '/api/v1/notifications/tokens', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * PATCH /api/v1/notifications/:notificationId/read
   * Mark notification as read
   */
  markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('PATCH', '/api/v1/notifications/:notificationId/read', { traceId });

    try {
      const { notificationId } = req.params;
      validate({ notificationId }, z.object({ notificationId: uuidSchema }));

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

      const notification = await this.notificationService.markAsRead(context, notificationId);
      this.success(res, notification, traceId);
    } catch (error) {
      this.logRequestError('PATCH', '/api/v1/notifications/:notificationId/read', error, {
        traceId,
      });
      this.error(res, error, traceId);
    }
  });
}
