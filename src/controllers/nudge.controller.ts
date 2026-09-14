import { Request, Response } from 'express';
import { z } from 'zod';
import {
  NudgeApplicationService,
  UpdateNudgePreferenceInput,
} from '@application/services/nudge.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate } from '@application/validators/application.validators';
import { asyncHandler } from '@utils/asyncHandler';
import { sendOk } from '@utils/response';
import { UnauthorizedError } from '@utils/error';
import { createLogger } from '@utils/logger';

const updateNudgePreferenceSchema = z.object({
  careHydration: z.boolean().optional(),
  peopleToRemember: z.boolean().optional(),
  checkingIn: z.boolean().optional(),
});

/**
 * Nudge Controller
 * Get/update the current user's per-category nudge toggle state
 * (care_hydration, people_to_remember, checking_in). No business logic here.
 */
export class NudgeController {
  private readonly logger = createLogger('NudgeController');
  private readonly nudgeService = new NudgeApplicationService();

  get = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'GET', path: '/api/v1/nudges/preferences' }, 'GET /api/v1/nudges/preferences');

    const context = this.requireContext(req);
    const preferences = await this.nudgeService.get(context);
    sendOk(res, preferences);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info(
      { method: 'PATCH', path: '/api/v1/nudges/preferences' },
      'PATCH /api/v1/nudges/preferences'
    );

    const patch = validate<UpdateNudgePreferenceInput>(req.body, updateNudgePreferenceSchema);
    const context = this.requireContext(req);

    const preferences = await this.nudgeService.update(context, patch);
    sendOk(res, preferences);
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
