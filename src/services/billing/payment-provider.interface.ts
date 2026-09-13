/**
 * IPaymentProvider — the boundary between BillingApplicationService and
 * whatever payment vendor eventually gets chosen (Razorpay, Stripe, etc.).
 * No vendor is hardcoded: swap the implementation the billing factory
 * returns once a provider is picked, without touching the application
 * service or controller.
 */

export type BillingPlan = 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY';

export interface CreateSubscriptionRequest {
  userId: string;
  plan: BillingPlan;
}

export interface CreateSubscriptionResult {
  /** Provider-specific subscription/order identifier. */
  subscriptionId: string;
  /** Where the client completes payment, if the provider requires a redirect/checkout step. */
  checkoutUrl?: string;
  status: 'PENDING' | 'ACTIVE';
}

export interface IPaymentProvider {
  createSubscription(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResult>;
}
