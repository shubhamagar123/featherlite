import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';
import { UserRepository } from '@database/repositories/user.repository';
import { ForbiddenError, NotFoundError } from '@utils/error';
import { getPaymentProvider } from '@services/billing/payment-provider.factory';
import type { BillingPlan } from '@services/billing/payment-provider.interface';
import type { BillingTier } from '@prisma/client';

export interface BillingStatusDto {
  tier: BillingTier;
  gates: {
    voicePlayback: boolean;
    secondCompanion: boolean;
  };
}

export interface SubscribeResultDto {
  subscriptionId: string;
  status: 'PENDING' | 'ACTIVE';
  tier: BillingTier;
}

/**
 * Billing Application Service
 * Resolves the user's current tier/entitlements and starts a subscription
 * via a swappable IPaymentProvider (mocked until a vendor is chosen).
 *
 * IMPORTANT: assertEntitled() is the server-side gate any endpoint that
 * returns voice-playback URLs or Kai access must call — entitlement is
 * never enforced client-side only.
 */
export class BillingApplicationService extends ApplicationServiceBase {
  private readonly userRepository: UserRepository;

  constructor() {
    super('BillingApplicationService');
    this.userRepository = new UserRepository();
  }

  async getStatus(context: ApplicationContext): Promise<BillingStatusDto> {
    this.logStart('getStatus', { userId: context.userId });

    const user = await this.userRepository.findById(context.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    this.logSuccess('getStatus', { userId: context.userId, tier: user.billingTier });
    return {
      tier: user.billingTier,
      gates: this.gatesFor(user.billingTier),
    };
  }

  async subscribe(context: ApplicationContext, plan: BillingPlan): Promise<SubscribeResultDto> {
    this.logStart('subscribe', { userId: context.userId, plan });

    const user = await this.userRepository.findById(context.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const result = await getPaymentProvider().createSubscription({ userId: context.userId, plan });

    if (result.status === 'ACTIVE') {
      await this.userRepository.update(context.userId, { billingTier: 'PREMIUM' } as any);
    }

    this.logSuccess('subscribe', { userId: context.userId, subscriptionId: result.subscriptionId });
    return {
      subscriptionId: result.subscriptionId,
      status: result.status,
      tier: result.status === 'ACTIVE' ? 'PREMIUM' : user.billingTier,
    };
  }

  /**
   * Server-side entitlement gate. Call this from any endpoint that returns
   * voice-playback URLs or Kai access — never rely on the client to enforce
   * gating. Throws (via the caller catching AppError-style errors) when not
   * entitled; callers should translate that into a 403.
   */
  async assertEntitled(context: ApplicationContext, _feature: 'voice_playback' | 'second_companion'): Promise<void> {
    const status = await this.getStatus(context);
    if (status.tier === 'FREE') {
      throw new ForbiddenError('This feature requires a Premium subscription');
    }
  }

  private gatesFor(tier: BillingTier): BillingStatusDto['gates'] {
    const isPremium = tier === 'PREMIUM';
    return {
      voicePlayback: isPremium,
      secondCompanion: isPremium,
    };
  }
}
