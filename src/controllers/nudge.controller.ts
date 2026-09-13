import { Request, Response } from 'express';
import { z } from 'zod';
import {
  NudgeApplicationService,
  CreateNudgePreferenceInput,
  UpdateNudgePreferenceInput,
} from '@application/services/nudge.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate } from '@application/validators/application.validators';
import { asyncHandler } from '@api/index';
import { sendOk, sendCreated, sendNoContent } from '@utils/response';
import { UnauthorizedError } from '@utils/error';
import { createLogger } from '@utils/logger';

const idParamSchema = z.object({
  id: z.string().min(1, 'Nudge preference id is required'),
});

const createNudgePreferenceSchema = z.object({
  nudgeType: z.string().min(1).max(100),
  enabled: z.boolean().optional(),
  frequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY']).optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm').optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm').optional(),
});

const updateNudgePreferenceSchema = z.object({
  enabled: z.boolean().optional(),
  frequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY']).optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm').optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm').optional(),
});

/**
 * Nudge Controller
 * CRUD for per-user nudge delivery preferences. No business logic here.
 */
export class NudgeController {
  private readonly logger = createLogger('NudgeController');
  private readonly nudgeService = new NudgeApplicationService();

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'POST', path: '/api/v1/nudges/preferences' }, 'POST /api/v1/nudges/preferences');

    const input = validate<CreateNudgePreferenceInput>(req.body, createNudgePreferenceSchema);
    const context = this.requireContext(req);

    const preference = await this.nudgeService.create(context, input);
    sendCreated(res, preference);
  });

  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'GET', path: '/api/v1/nudges/preferences' }, 'GET /api/v1/nudges/preferences');

    const context = this.requireContext(req);
    const preferences = await this.nudgeService.list(context);
    sendOk(res, { preferences, count: preferences.length });
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info(
      { method: 'GET', path: '/api/v1/nudges/preferences/:id' },
      'GET /api/v1/nudges/preferences/:id'
    );

    const { id } = validate<{ id: string }>(req.params, idParamSchema);
    const context = this.requireContext(req);

    const preference = await this.nudgeService.getById(context, id);
    sendOk(res, preference);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info(
      { method: 'PATCH', path: '/api/v1/nudges/preferences/:id' },
      'PATCH /api/v1/nudges/preferences/:id'
    );

    const { id } = validate<{ id: string }>(req.params, idParamSchema);
    const patch = validate<UpdateNudgePreferenceInput>(req.body, updateNudgePreferenceSchema);
    const context = this.requireContext(req);

    const preference = await this.nudgeService.update(context, id, patch);
    sendOk(res, preference);
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info(
      { method: 'DELETE', path: '/api/v1/nudges/preferences/:id' },
      'DELETE /api/v1/nudges/preferences/:id'
    );

    const { id } = validate<{ id: string }>(req.params, idParamSchema);
    const context = this.requireContext(req);

    await this.nudgeService.delete(context, id);
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
