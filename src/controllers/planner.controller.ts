import { Request, Response } from 'express';
import { z } from 'zod';
import {
  PlannerApplicationService,
  CreatePlannerEventInput,
  UpdatePlannerEventInput,
} from '@application/services/planner.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate } from '@application/validators/application.validators';
import { asyncHandler } from '@utils/asyncHandler';
import { sendOk, sendCreated, sendNoContent } from '@utils/response';
import { UnauthorizedError } from '@utils/error';
import { createLogger } from '@utils/logger';

const idParamSchema = z.object({
  id: z.string().min(1, 'Planner event id is required'),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
});

const createPlannerEventSchema = z.object({
  companionId: z.string().min(1).optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  scheduledFor: z.coerce.date(),
  metadata: z.record(z.unknown()).optional(),
});

const updatePlannerEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  scheduledFor: z.coerce.date().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Planner Controller
 * CRUD for user-scheduled planner events. No business logic here.
 */
export class PlannerController {
  private readonly logger = createLogger('PlannerController');
  private readonly plannerService = new PlannerApplicationService();

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'POST', path: '/api/v1/planner/events' }, 'POST /api/v1/planner/events');

    const input = validate<CreatePlannerEventInput>(req.body, createPlannerEventSchema);
    const context = this.requireContext(req);

    const event = await this.plannerService.create(context, input);
    sendCreated(res, event);
  });

  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'GET', path: '/api/v1/planner/events' }, 'GET /api/v1/planner/events');

    const { limit } = validate<{ limit: number }>(req.query, listQuerySchema);
    const context = this.requireContext(req);

    const events = await this.plannerService.list(context, limit);
    sendOk(res, { events, count: events.length });
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info(
      { method: 'GET', path: '/api/v1/planner/events/:id' },
      'GET /api/v1/planner/events/:id'
    );

    const { id } = validate<{ id: string }>(req.params, idParamSchema);
    const context = this.requireContext(req);

    const event = await this.plannerService.getById(context, id);
    sendOk(res, event);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info(
      { method: 'PATCH', path: '/api/v1/planner/events/:id' },
      'PATCH /api/v1/planner/events/:id'
    );

    const { id } = validate<{ id: string }>(req.params, idParamSchema);
    const patch = validate<UpdatePlannerEventInput>(req.body, updatePlannerEventSchema);
    const context = this.requireContext(req);

    const event = await this.plannerService.update(context, id, patch);
    sendOk(res, event);
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info(
      { method: 'DELETE', path: '/api/v1/planner/events/:id' },
      'DELETE /api/v1/planner/events/:id'
    );

    const { id } = validate<{ id: string }>(req.params, idParamSchema);
    const context = this.requireContext(req);

    await this.plannerService.delete(context, id);
    sendNoContent(res);
  });

  private requireContext(req: Request): ApplicationContext {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError();
    }
    return {
      userId: user.uid,
      userEmail: user.email,
      userRoles: (user.customClaims?.roles as string[]) || [],
      requestId: String(req.id ?? ''),
      traceId: String(req.id ?? ''),
      timestamp: new Date(),
    };
  }
}
