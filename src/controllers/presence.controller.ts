import { Request, Response } from 'express';
import { z } from 'zod';
import { PresenceApplicationService } from '@application/services/presence.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate, uuidSchema } from '@application/validators/application.validators';
import { asyncHandler } from '@api/index';
import { sendOk } from '@utils/response';
import { UnauthorizedError } from '@utils/error';
import { createLogger } from '@utils/logger';

const resolvePresenceQuerySchema = z.object({
  companionId: uuidSchema,
});

/**
 * Presence Controller
 * Handles the client's video/light-state resolver endpoint.
 * No business logic here — validates input, delegates to the application
 * service, and formats the response.
 */
export class PresenceController {
  private readonly logger = createLogger('PresenceController');
  private readonly presenceService = new PresenceApplicationService();

  /**
   * GET /api/v1/presence/resolve?companionId=...
   * Resolve current companion/world state via the Context Engine.
   */
  resolve = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'GET', path: '/api/v1/presence/resolve' }, 'GET /api/v1/presence/resolve');

    const { companionId } = validate<{ companionId: string }>(req.query, resolvePresenceQuerySchema);

    const user = req.user;
    if (!user) {
      throw new UnauthorizedError();
    }

    const context: ApplicationContext = {
      userId: user.uid,
      userEmail: user.email,
      userRoles: (user.customClaims?.roles as string[]) || [],
      requestId: String(req.id ?? ''),
      traceId: String(req.id ?? ''),
      timestamp: new Date(),
    };

    const presence = await this.presenceService.resolve(context, companionId);

    sendOk(res, presence);
  });
}
