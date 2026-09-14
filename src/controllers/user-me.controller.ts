import { Request, Response } from 'express';
import { z } from 'zod';
import {
  UserApplicationService,
  UpdateUserMeInput,
} from '@application/services/user.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate } from '@application/validators/application.validators';
import { asyncHandler } from '@utils/asyncHandler';
import { sendOk, sendNoContent } from '@utils/response';
import { UnauthorizedError } from '@utils/error';
import { createLogger } from '@utils/logger';

const updateMeSchema = z.object({
  activeCompanion: z.string().min(1).max(100).optional(),
  addressTerm: z.string().min(1).max(100).optional(),
});

/**
 * User "Me" Controller
 * GET/PATCH/DELETE /api/v1/users/me — profile summary, profile updates,
 * and full account deletion. No business logic here.
 */
export class UserMeController {
  private readonly logger = createLogger('UserMeController');
  private readonly userService = new UserApplicationService();

  getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'GET', path: '/api/v1/users/me' }, 'GET /api/v1/users/me');

    const context = this.requireContext(req);
    const me = await this.userService.getMe(context);
    sendOk(res, me);
  });

  updateMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'PATCH', path: '/api/v1/users/me' }, 'PATCH /api/v1/users/me');

    const patch = validate<UpdateUserMeInput>(req.body, updateMeSchema);
    const context = this.requireContext(req);

    const me = await this.userService.updateMe(context, patch);
    sendOk(res, me);
  });

  deleteMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'DELETE', path: '/api/v1/users/me' }, 'DELETE /api/v1/users/me');

    const context = this.requireContext(req);
    await this.userService.deleteMe(context);
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
