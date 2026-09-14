import type { IPaymentProvider } from './payment-provider.interface';
import { MockPaymentProvider } from './mock-payment-provider';

let cached: IPaymentProvider | null = null;

/**
 * Returns the active payment provider. No real vendor is wired up yet —
 * this always returns the mock. When a vendor is chosen, branch on
 * environment.PAYMENT_PROVIDER (or similar) here; nothing outside this
 * factory needs to change.
 */
export function getPaymentProvider(): IPaymentProvider {
  if (!cached) {
    cached = new MockPaymentProvider();
  }
  return cached;
}

export function resetPaymentProvider(): void {
  cached = null;
}
