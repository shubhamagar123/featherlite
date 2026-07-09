import { logger } from '@utils/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterPercent?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterPercent: 0.1,
};

export class RetryStrategy {
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    operation: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < opts.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, opts);
          logger.warn(
            {
              operation,
              attempt: attempt + 1,
              maxRetries: opts.maxRetries,
              delayMs: delay,
              error: lastError.message,
            },
            `Retrying operation after delay`
          );

          await this.sleep(delay);
        }
      }
    }

    logger.error(
      {
        operation,
        attempts: opts.maxRetries + 1,
        error: lastError?.message,
      },
      'Operation failed after all retries'
    );

    throw lastError;
  }

  static exponentialBackoffDelay(
    attemptNumber: number,
    baseDelayMs: number = 100,
    maxDelayMs: number = 10000,
    multiplier: number = 2
  ): number {
    const exponentialDelay = baseDelayMs * Math.pow(multiplier, attemptNumber);
    return Math.min(exponentialDelay, maxDelayMs);
  }

  private static calculateBackoffDelay(attempt: number, options: Required<RetryOptions>): number {
    const baseDelay = this.exponentialBackoffDelay(
      attempt,
      options.initialDelayMs,
      options.maxDelayMs,
      options.backoffMultiplier
    );

    const jitter = baseDelay * options.jitterPercent * (Math.random() * 2 - 1);
    return Math.max(0, Math.floor(baseDelay + jitter));
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class CircuitBreakerPattern {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly successThreshold: number = 2,
    private readonly timeoutMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>, operationName: string): Promise<T> {
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure >= this.timeoutMs) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        logger.info({ operationName }, 'Circuit breaker half-open, attempting recovery');
      } else {
        throw new Error(`Circuit breaker is OPEN for operation: ${operationName}`);
      }
    }

    try {
      const result = await fn();

      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.state = 'CLOSED';
          this.failureCount = 0;
          logger.info({ operationName }, 'Circuit breaker closed, recovered');
        }
      } else if (this.state === 'CLOSED') {
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.state === 'HALF_OPEN') {
        this.state = 'OPEN';
        logger.error({ operationName }, 'Circuit breaker reopened after failure in HALF_OPEN state');
      } else if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        logger.error(
          { operationName, failureCount: this.failureCount },
          'Circuit breaker opened due to threshold exceeded'
        );
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
  }
}
