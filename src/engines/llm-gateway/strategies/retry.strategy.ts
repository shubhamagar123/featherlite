import { LLMRetryPolicy } from '../dtos/llm-gateway.dtos';

export class RetryStrategy {
  constructor(private readonly policy: LLMRetryPolicy) {}

  computeDelay(attempt: number): number {
    const raw =
      this.policy.initialDelayMs *
      Math.pow(this.policy.backoffMultiplier, Math.max(0, attempt - 1));
    const bounded = Math.min(this.policy.maxDelayMs, raw);
    if (!this.policy.jitter) return bounded;
    const jitterFactor = 0.5 + Math.random() * 0.5;
    return Math.floor(bounded * jitterFactor);
  }

  shouldRetry(attempt: number, error: Error): boolean {
    if (attempt >= this.policy.maxAttempts) return false;
    const message = (error.message || '').toLowerCase();
    if (message.includes('invalid') || message.includes('unauthorized')) return false;
    return true;
  }

  getMaxAttempts(): number {
    return this.policy.maxAttempts;
  }

  async wait(ms: number): Promise<void> {
    if (ms <= 0) return;
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
