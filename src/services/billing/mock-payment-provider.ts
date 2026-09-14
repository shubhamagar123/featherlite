import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@utils/logger';
import type {
  CreateSubscriptionRequest,
  CreateSubscriptionResult,
  IPaymentProvider,
} from './payment-provider.interface';

/**
 * MockPaymentProvider — stands in for a real vendor (Razorpay/Stripe/etc.)
 * until one is chosen. Always "succeeds" immediately with no real charge,
 * so the rest of the billing flow (BillingApplicationService, the tier
 * update, entitlement checks) can be built and tested against a stable
 * interface today and swapped for a real integration later without
 * touching any caller.
 */
export class MockPaymentProvider implements IPaymentProvider {
  private readonly logger = createLogger('MockPaymentProvider');

  async createSubscription(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResult> {
    this.logger.info({ userId: request.userId, plan: request.plan }, 'Mock subscription created');

    return {
      subscriptionId: `mock_sub_${uuidv4()}`,
      status: 'ACTIVE',
    };
  }
}
