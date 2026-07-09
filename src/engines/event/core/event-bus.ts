import { IResult, Result } from '@services/types/result.type';
import { IEventBus, IEventRegistry, IEventDispatcher } from '../interfaces/event-bus.interface';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { EventEnvelope, DeadLetterEntry, EventMetrics, DomainEventPayload, EventRetryPolicy } from '../dto/event.dto';
import { EventType, EventDispatchMode, EventStatus } from '../enums/event.enums';
import { EventRegistry } from './event-registry';
import { EventDispatcher } from './event-dispatcher';
import { BullMQDispatcher } from './bullmq-dispatcher';
import { createLogger } from '@utils/logger';
import { getEnvironment } from '@config/environment';
import { redisDLQService, redisProvider } from '@infra/redis';
import type { Logger } from 'pino';

export class EventBus implements IEventBus {
  private readonly registry: IEventRegistry;
  private readonly dispatcher: IEventDispatcher;
  private readonly logger: Logger;
  private deadLetterQueue: DeadLetterEntry[] = [];
  private useRedisForDLQ: boolean = false;
  private metrics: EventMetrics = {
    published: 0,
    processed: 0,
    failed: 0,
    retried: 0,
    deadLettered: 0,
    averageProcessingTimeMs: 0,
  };
  private processingTimes: number[] = [];

  constructor(retryPolicy?: EventRetryPolicy) {
    this.registry = new EventRegistry();
    this.dispatcher = this.createDispatcher(retryPolicy);
    this.logger = createLogger('EventBus');
    this.useRedisForDLQ = this.checkRedisAvailability();
  }

  private createDispatcher(retryPolicy?: EventRetryPolicy): IEventDispatcher {
    const env = getEnvironment();

    if (env.FEATURE_BULLMQ_DISPATCHER) {
      try {
        this.logger.info('Using BullMQ dispatcher for event processing');
        return new BullMQDispatcher(this.registry, retryPolicy);
      } catch (error) {
        this.logger.warn({ error }, 'Failed to initialize BullMQ dispatcher, falling back to default');
        return new EventDispatcher(this.registry, retryPolicy);
      }
    }

    return new EventDispatcher(this.registry, retryPolicy);
  }

  private checkRedisAvailability(): boolean {
    try {
      if (redisProvider.isReady()) {
        this.logger.info('Using Redis for dead-letter queue persistence');
        return true;
      }
    } catch {
      // Redis not available, fall through
    }
    this.logger.info('Using in-memory dead-letter queue');
    return false;
  }

  async publish<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      const startTime = Date.now();

      try {
        envelope.status = EventStatus.PROCESSING;
        this.metrics.published++;

        const result = await this.dispatcher.dispatch(envelope, mode);

        if (result.isSuccess) {
          envelope.status = EventStatus.PUBLISHED;
          envelope.publishedAt = new Date();
          this.metrics.processed++;
        } else {
          envelope.status = EventStatus.FAILED;
          envelope.lastError = result.error;
          this.metrics.failed++;

          this.addToDeadLetterQueue(envelope, result.error?.message || 'Unknown error');
        }
      } catch (error) {
        envelope.status = EventStatus.FAILED;
        envelope.lastError = error instanceof Error ? error : new Error(String(error));
        this.metrics.failed++;
        this.metrics.deadLettered++;

        this.addToDeadLetterQueue(
          envelope,
          error instanceof Error ? error.message : String(error)
        );

        throw error;
      } finally {
        const duration = Date.now() - startTime;
        this.recordMetric(duration);

        this.logger.debug(
          {
            eventId: envelope.metadata.eventId,
            eventType: envelope.metadata.eventType,
            status: envelope.status,
            durationMs: duration,
          },
          'Event published'
        );
      }
    });
  }

  subscribe<T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: IEventHandler<T>,
    priority?: number
  ): string {
    const subscriptionId = this.registry.register(eventType, handler, priority || 1);

    this.logger.debug(
      {
        eventType,
        handlerId: handler.getMetadata().handlerId,
        subscriptionId,
      },
      'Event handler registered'
    );

    return subscriptionId;
  }

  unsubscribe(eventType: EventType, subscriptionId: string): IResult<void> {
    return Result.try(() => {
      const success = this.registry.unregister(eventType, subscriptionId);

      if (success) {
        this.logger.debug(
          {
            eventType,
            subscriptionId,
          },
          'Event handler unregistered'
        );
      } else {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
    });
  }

  getDeadLetterQueue(): DeadLetterEntry[] {
    if (this.useRedisForDLQ) {
      return this.deadLetterQueue;
    }
    return [...this.deadLetterQueue];
  }

  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.deadLetterQueue = [];
    this.metrics = {
      published: 0,
      processed: 0,
      failed: 0,
      retried: 0,
      deadLettered: 0,
      averageProcessingTimeMs: 0,
    };
    this.processingTimes = [];
    (this.registry as EventRegistry).clear();

    if (this.useRedisForDLQ) {
      void redisDLQService.clear();
    }
  }

  private addToDeadLetterQueue(envelope: EventEnvelope, reason: string): void {
    const handlers = this.registry.getHandlers(envelope.metadata.eventType);
    const entry: DeadLetterEntry = {
      envelope,
      reason,
      timestamp: new Date(),
      handlers: handlers.map(h => h.handler.getMetadata()),
    };

    if (this.useRedisForDLQ) {
      void redisDLQService.append(entry);
    } else {
      this.deadLetterQueue.push(entry);
    }

    this.metrics.deadLettered++;

    this.logger.warn(
      {
        eventId: envelope.metadata.eventId,
        eventType: envelope.metadata.eventType,
        reason,
      },
      'Event moved to dead letter queue'
    );
  }

  private recordMetric(duration: number): void {
    this.processingTimes.push(duration);

    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-500);
    }

    this.metrics.averageProcessingTimeMs =
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }
}
