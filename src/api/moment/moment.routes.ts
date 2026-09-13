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
 * Moment API Routes
 * GET /api/v1/moment            - List upcoming moments (scheduled events)
 * GET /api/v1/moment/:momentId  - Get moment details
 * GET /api/v1/moment/upcoming   - Get next scheduled moments
 *
 * Moments are scheduled events/interactions with the companion:
 * - Daily check-ins
 * - Birthday reminders
 * - Anniversary celebrations
 * - Periodic conversation prompts
 * - Special occasion notifications
 */

const listMomentsSchema = {
  query: commonSchemas.pagination.extend({
    upcoming: z.coerce.boolean().optional(),
    type: z.enum(['daily', 'event', 'reminder', 'milestone']).optional(),
  }),
};

const momentIdSchema = {
  params: z.object({
    momentId: commonSchemas.uuid,
  }),
};

const upcomingMomentsSchema = {
  query: z.object({
    days: z.coerce.number().int().positive().max(30).default(7),
  }),
};

const completedMomentsSchema = {
  query: commonSchemas.pagination,
};

export async function registerMomentRoutes(app: Application): Promise<void> {
  const baseRoute = '/api/v1/moment';

  /**
   * GET /api/v1/moment
   * List all moments (scheduled events) for the user
   */
  app.get(
    baseRoute,
    authenticate,
    rateLimiters.api,
    validate(listMomentsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { page = 1, limit = 20 } = req.query as Record<
        string,
        any
      >;

      try {
        // TODO: Query MomentRepository with optional filters
        const moments = [
          {
            momentId: '550e8400-e29b-41d4-a716-446655440000',
            userId,
            title: 'Daily Check-in',
            description: 'Time for your daily chat with your companion',
            type: 'daily',
            scheduledFor: new Date(Date.now() + 3600000).toISOString(),
            createdAt: new Date().toISOString(),
          },
        ];

        res.status(200).json(
          paginatedResponse(moments, page, limit, 1, String(req.id))
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to list moments');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/moment/upcoming
   * Get next scheduled moments (next 7 days by default)
   */
  app.get(
    `${baseRoute}/upcoming`,
    authenticate,
    rateLimiters.api,
    validate(upcomingMomentsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { days = 7 } = req.query as Record<string, any>;

      try {
        // TODO: Query MomentRepository for upcoming moments in next N days
        const upcomingMoments = [
          {
            momentId: '550e8400-e29b-41d4-a716-446655440000',
            userId,
            title: 'Daily Check-in',
            description: 'Time for your daily chat',
            type: 'daily',
            scheduledFor: new Date(Date.now() + 3600000).toISOString(),
            priority: 'normal',
          },
          {
            momentId: '550e8400-e29b-41d4-a716-446655440001',
            userId,
            title: 'Weekly Check-in',
            description: 'Week in review conversation',
            type: 'reminder',
            scheduledFor: new Date(Date.now() + 604800000).toISOString(), // 7 days
            priority: 'high',
          },
        ];

        logger.info(
          { userId, days, count: upcomingMoments.length },
          'Upcoming moments retrieved'
        );

        res.status(200).json(
          successResponse(
            {
              days,
              moments: upcomingMoments,
              count: upcomingMoments.length,
            },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to get upcoming moments');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/moment/:momentId
   * Get details of a specific moment
   */
  app.get(
    `${baseRoute}/:momentId`,
    authenticate,
    rateLimiters.api,
    validate(momentIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { momentId } = req.params;

      try {
        // TODO: Query MomentRepository and verify ownership
        const moment = {
          momentId,
          userId,
          title: 'Moment Title',
          description: 'Moment description',
          type: 'daily',
          scheduledFor: new Date(Date.now() + 3600000).toISOString(),
          metadata: {
            triggeredBy: 'schedule',
            context: 'daily-checkin',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        res.status(200).json(successResponse(moment, String(req.id)));
      } catch (error) {
        logger.error(
          { error, userId, momentId },
          'Failed to get moment details'
        );
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/moment/completed
   * Get completed moments (past interactions)
   */
  app.get(
    `${baseRoute}/completed`,
    authenticate,
    rateLimiters.api,
    validate(completedMomentsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { page = 1, limit = 20 } = req.query as Record<string, any>;

      try {
        // TODO: Query completed moments from MomentRepository
        const completedMoments: any[] = [];

        res.status(200).json(
          paginatedResponse(completedMoments, page, limit, 0, String(req.id))
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to get completed moments');
        throw error;
      }
    })
  );

  logger.info('✅ Moment routes registered');
}
