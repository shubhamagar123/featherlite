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
 * Notification API Routes
 * GET    /api/v1/notification              - List notifications for user
 * GET    /api/v1/notification/:notificationId - Get specific notification
 * PATCH  /api/v1/notification/:notificationId - Mark notification as read
 * DELETE /api/v1/notification/:notificationId - Delete notification
 * POST   /api/v1/notification/mark-read       - Mark multiple as read
 * DELETE /api/v1/notification/clear-all       - Clear all notifications
 * GET    /api/v1/notification/preferences    - Get notification preferences
 * PUT    /api/v1/notification/preferences    - Update notification preferences
 */

const listNotificationsSchema = z.object({
  query: commonSchemas.pagination.extend({
    unreadOnly: z.coerce.boolean().optional(),
    type: z.enum(['message', 'activity', 'reminder', 'system']).optional(),
  }),
});

const notificationIdSchema = z.object({
  params: z.object({
    notificationId: commonSchemas.uuid,
  }),
});

const markReadSchema = z.object({
  body: z.object({
    notificationIds: z.array(commonSchemas.uuid),
  }),
});

const updatePreferencesSchema = z.object({
  body: z.object({
    enableNotifications: z.boolean().optional(),
    enableCompanionMessages: z.boolean().optional(),
    enableReminders: z.boolean().optional(),
    enableSystemAlerts: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  }),
});

export async function registerNotificationRoutes(
  app: Application
): Promise<void> {
  const baseRoute = '/api/v1/notification';

  /**
   * GET /api/v1/notification
   * List all notifications for the current user
   */
  app.get(
    baseRoute,
    authenticate,
    rateLimiters.api,
    validate(listNotificationsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { page = 1, limit = 20, unreadOnly, type } = req.query as Record<
        string,
        any
      >;

      try {
        // TODO: Query NotificationRepository with filters
        const notifications = [
          {
            notificationId: '550e8400-e29b-41d4-a716-446655440000',
            userId,
            title: 'New message from companion',
            message: 'Your companion sent you a message',
            type: 'message',
            read: false,
            createdAt: new Date().toISOString(),
            action: {
              type: 'navigate',
              target: '/conversation/sess_123',
            },
          },
        ];

        res.status(200).json(
          paginatedResponse(notifications, page, limit, 1, String(req.id))
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to list notifications');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/notification/:notificationId
   * Get a specific notification
   */
  app.get(
    `${baseRoute}/:notificationId`,
    authenticate,
    rateLimiters.api,
    validate(notificationIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { notificationId } = req.params;

      try {
        // TODO: Query NotificationRepository and verify ownership
        const notification = {
          notificationId,
          userId,
          title: 'Notification Title',
          message: 'Notification message',
          type: 'message',
          read: false,
          createdAt: new Date().toISOString(),
        };

        res.status(200).json(successResponse(notification, String(req.id)));
      } catch (error) {
        logger.error(
          { error, userId, notificationId },
          'Failed to get notification'
        );
        throw error;
      }
    })
  );

  /**
   * PATCH /api/v1/notification/:notificationId
   * Mark a notification as read
   */
  app.patch(
    `${baseRoute}/:notificationId`,
    authenticate,
    rateLimiters.api,
    validate(notificationIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { notificationId } = req.params;

      try {
        // TODO: Mark notification as read
        logger.info({ userId, notificationId }, 'Notification marked as read');

        res.status(200).json(
          successResponse(
            { success: true, message: 'Marked as read' },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId, notificationId }, 'Failed to mark as read');
        throw error;
      }
    })
  );

  /**
   * DELETE /api/v1/notification/:notificationId
   * Delete a notification
   */
  app.delete(
    `${baseRoute}/:notificationId`,
    authenticate,
    rateLimiters.api,
    validate(notificationIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { notificationId } = req.params;

      try {
        // TODO: Delete notification
        logger.info({ userId, notificationId }, 'Notification deleted');

        res.status(200).json(
          successResponse(
            { success: true, message: 'Notification deleted' },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId, notificationId }, 'Failed to delete notification');
        throw error;
      }
    })
  );

  /**
   * POST /api/v1/notification/mark-read
   * Mark multiple notifications as read
   */
  app.post(
    `${baseRoute}/mark-read`,
    authenticate,
    rateLimiters.api,
    validate(markReadSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { notificationIds } = req.body;

      try {
        // TODO: Bulk mark notifications as read
        logger.info(
          { userId, count: notificationIds.length },
          'Notifications marked as read'
        );

        res.status(200).json(
          successResponse(
            { success: true, markedCount: notificationIds.length },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to mark notifications as read');
        throw error;
      }
    })
  );

  /**
   * DELETE /api/v1/notification/clear-all
   * Clear all notifications for the user
   */
  app.delete(
    `${baseRoute}/clear-all`,
    authenticate,
    rateLimiters.api,
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;

      try {
        // TODO: Delete all notifications for user
        logger.info({ userId }, 'All notifications cleared');

        res.status(200).json(
          successResponse(
            { success: true, message: 'All notifications cleared' },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to clear notifications');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/notification/preferences
   * Get notification preferences for the user
   */
  app.get(
    `${baseRoute}/preferences`,
    authenticate,
    rateLimiters.api,
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;

      try {
        // TODO: Query user notification preferences
        const preferences = {
          enableNotifications: true,
          enableCompanionMessages: true,
          enableReminders: true,
          enableSystemAlerts: true,
          emailNotifications: false,
          pushNotifications: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        };

        res.status(200).json(successResponse(preferences, String(req.id)));
      } catch (error) {
        logger.error({ error, userId }, 'Failed to get notification preferences');
        throw error;
      }
    })
  );

  /**
   * PUT /api/v1/notification/preferences
   * Update notification preferences
   */
  app.put(
    `${baseRoute}/preferences`,
    authenticate,
    rateLimiters.api,
    validate(updatePreferencesSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const updates = req.body;

      try {
        // TODO: Update user notification preferences
        logger.info({ userId, fields: Object.keys(updates) }, 'Preferences updated');

        res.status(200).json(
          successResponse(
            { success: true, message: 'Preferences updated', ...updates },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to update notification preferences');
        throw error;
      }
    })
  );

  logger.info('✅ Notification routes registered');
}
