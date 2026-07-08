import { IResult, Result } from '@services/types/result.type';
import { IEventDispatcher, IEventRegistry } from '../interfaces/event-bus.interface';
import { EventEnvelope, DomainEventPayload, EventRetryPolicy } from '../dto/event.dto';
import { EventDispatchMode } from '../enums/event.enums';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

export class EventDispatcher implements IEventDispatcher {
  private readonly logger: Logger;
  private readonly registry: IEventRegistry;
  private readonly retryPolicy: EventRetryPolicy;

  constructor(
    registry: IEventRegistry,
    retryPolicy: EventRetryPolicy = {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      backoffJitter: true,
    }
  ) {
    this.registry = registry;
    this.retryPolicy = retryPolicy;
    this.logger = createLogger('EventDispatcher');
  }

  async dispatch<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    mode: EventDispatchMode
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      const handlers = this.registry.getHandlers(envelope.metadata.eventType);

      if (handlers.length === 0) {
        this.logger.warn(
          { eventType: envelope.metadata.eventType, eventId: envelope.metadata.eventId },
          'No handlers found for event'
        );
        return;
      }

      if (mode === EventDispatchMode.SYNC) {
        await this.dispatchSync(envelope, handlers);
      } else {
        this.dispatchAsync(envelope, handlers);
      }
    });
  }

  private async dispatchSync<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    handlers: Array<{ handler: any; priority: number }>
  ): Promise<void> {
    const errors: Error[] = [];

    for (const { handler } of handlers) {
      if (!handler.canHandle(envelope)) {
        continue;
      }

      try {
        const result = await this.executeWithRetry(envelope, handler);
        if (result.isFailure) {
          this.logger.error(
            {
              eventId: envelope.metadata.eventId,
              handlerId: handler.getMetadata().handlerId,
              error: result.error?.message,
            },
            'Handler failed'
          );
          errors.push(result.error || new Error('Unknown handler error'));
          await handler.onError(envelope, result.error || new Error('Unknown handler error'));
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          {
            eventId: envelope.metadata.eventId,
            handlerId: handler.getMetadata().handlerId,
            error: err.message,
          },
          'Unexpected error in handler'
        );
        errors.push(err);
        await handler.onError(envelope, err);
      }
    }

    if (errors.length > 0) {
      throw errors[0];
    }
  }

  private dispatchAsync<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    handlers: Array<{ handler: any; priority: number }>
  ): void {
    setImmediate(async () => {
      for (const { handler } of handlers) {
        if (!handler.canHandle(envelope)) {
          continue;
        }

        try {
          await this.executeWithRetry(envelope, handler);
        } catch (error) {
          this.logger.error(
            {
              eventId: envelope.metadata.eventId,
              handlerId: handler.getMetadata().handlerId,
              error: error instanceof Error ? error.message : String(error),
            },
            'Async handler error'
          );
          await handler.onError(envelope, error instanceof Error ? error : new Error(String(error)));
        }
      }
    });
  }

  private async executeWithRetry<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    handler: any
  ): Promise<IResult<void>> {
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < this.retryPolicy.maxAttempts) {
      try {
        const result = await handler.handle(envelope);

        if (result.isSuccess) {
          return result;
        }

        lastError = result.error;
        attempt++;

        if (attempt < this.retryPolicy.maxAttempts) {
          await this.delay(this.calculateBackoff(attempt));
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        if (attempt < this.retryPolicy.maxAttempts) {
          await this.delay(this.calculateBackoff(attempt));
        }
      }
    }

    return Result.failure(lastError || new Error('Max retries exceeded'));
  }

  private calculateBackoff(attempt: number): number {
    let delay = this.retryPolicy.initialDelayMs * Math.pow(this.retryPolicy.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.retryPolicy.maxDelayMs);

    if (this.retryPolicy.backoffJitter) {
      delay *= 0.5 + Math.random();
    }

    return Math.round(delay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
