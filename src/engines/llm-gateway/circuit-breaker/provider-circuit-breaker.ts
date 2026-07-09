/**
 * Circuit breaker per LLM provider.
 *
 * States:
 *   CLOSED: Normal operation, requests pass through.
 *   OPEN: Provider failing repeatedly, requests immediately rejected.
 *   HALF_OPEN: Recovery window open, limited requests allowed to test provider.
 *
 * Transitions:
 *   CLOSED → OPEN: After failureThreshold consecutive failures.
 *   OPEN → HALF_OPEN: After resetTimeoutMs have elapsed.
 *   HALF_OPEN → CLOSED: If request succeeds.
 *   HALF_OPEN → OPEN: If request fails.
 */

import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { LLMProviderType } from '../enums/llm-gateway.enums';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class ProviderCircuitBreaker {
  private readonly logger: Logger;
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(
    private readonly provider: LLMProviderType,
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 30_000,
    private readonly successThreshold: number = 2
  ) {
    this.logger = createLogger('CircuitBreaker');
  }

  recordSuccess(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.reset();
        this.logger.info(
          { provider: this.provider, successCount: this.successCount },
          'Circuit breaker recovered; reset to CLOSED'
        );
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Stay closed
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreakerState.CLOSED) {
      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
        this.logger.warn(
          { provider: this.provider, failureCount: this.failureCount },
          'Circuit breaker tripped; transitioning to OPEN'
        );
      }
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open immediately reopens
      this.state = CircuitBreakerState.OPEN;
      this.successCount = 0;
      this.logger.warn(
        { provider: this.provider },
        'Circuit breaker failed recovery attempt; reverting to OPEN'
      );
    }
  }

  isAvailable(): boolean {
    if (this.state === CircuitBreakerState.CLOSED) {
      return true;
    }

    if (this.state === CircuitBreakerState.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
        this.logger.info(
          { provider: this.provider, elapsedMs: elapsed },
          'Circuit breaker timeout expired; transitioning to HALF_OPEN'
        );
        return true;
      }
      return false;
    }

    // HALF_OPEN: Allow requests
    return true;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  private reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}
