import { Request, Response } from 'express';
import { PrivacyApplicationService } from '@application/services/privacy.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { asyncHandler } from '@utils/asyncHandler';
import { sendOk } from '@utils/response';
import { UnauthorizedError } from '@utils/error';
import { createLogger } from '@utils/logger';

/**
 * Privacy Controller
 * GET /api/v1/privacy/export — full data export for the privacy screen's
 * "delete anytime" promise. No business logic here.
 */
export class PrivacyController {
  private readonly logger = createLogger('PrivacyController');
  private readonly privacyService = new PrivacyApplicationService();

  export = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'GET', path: '/api/v1/privacy/export' }, 'GET /api/v1/privacy/export');

    const context = this.requireContext(req);
    const data = await this.privacyService.exportData(context);
    sendOk(res, data);
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
