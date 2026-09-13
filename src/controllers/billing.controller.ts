import { Request, Response } from 'express';
import { z } from 'zod';
import { BillingApplicationService } from '@application/services/billing.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate } from '@application/validators/application.validators';
import { asyncHandler } from '@utils/asyncHandler';
import { sendOk } from '@utils/response';
import { UnauthorizedError } from '@utils/error';
import { createLogger } from '@utils/logger';

const subscribeSchema = z.object({
  plan: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_YEARLY']),
});

/**
 * Billing Controller
 * Current tier/entitlement status and subscription kickoff. No business
 * logic here — payment vendor selection lives behind IPaymentProvider.
 */
export class BillingController {
  private readonly logger = createLogger('BillingController');
  private readonly billingService = new BillingApplicationService();

  status = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'GET', path: '/api/v1/billing/status' }, 'GET /api/v1/billing/status');

    const context = this.requireContext(req);
    const status = await this.billingService.getStatus(context);
    sendOk(res, status);
  });

  subscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'POST', path: '/api/v1/billing/subscribe' }, 'POST /api/v1/billing/subscribe');

    const { plan } = validate<{ plan: 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' }>(req.body, subscribeSchema);
    const context = this.requireContext(req);

    const result = await this.billingService.subscribe(context, plan);
    sendOk(res, result);
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
