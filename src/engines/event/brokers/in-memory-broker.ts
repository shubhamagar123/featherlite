import { BaseBrokerAdapter } from './broker-adapter.base';
import { IResult, Result } from '@services/types/result.type';
import { EventEnvelope, DomainEventPayload, EventRetryPolicy } from '../dto/event.dto';
import { EventType, EventDispatchMode, EventStatus } from '../enums/event.enums';
import { EventRegistry } from '../core/event-registry';
import { EventDispatcher } from '../core/event-dispatcher';
import { IEventHandler } from '../interfaces/event-handler.interface';

/**
 * In-memory broker adapter (default, reference implementation).
 * No external dependencies, suitable for development and testing.
 * Events are dispatched synchronously or asynchronously in-process.
 */
export class InMemoryBroker extends BaseBrokerAdapter {
  private readonly registry: EventRegistry;
  private readonly dispatcher: EventDispatcher;
  private processingTimes: number[] = [];
  private isInitialized = false;

  constructor(retryPolicy?: EventRetryPolicy) {
    super('InMemory');
    this.registry = new EventRegistry();
    this.dispatcher = new EventDispatcher(this.registry, retryPolicy);
  }

  async initialize(): Promise<IResult<void>> {
    return Result.try(() => {
      if (this.isInitialized) {
        return;
      }
      this.isInitialized = true;
      this.logger.info('In-memory broker initialized');
    });
  }

  async shutdown(): Promise<IResult<void>> {
    return Result.try(() => {
      this.subscriptionMap.clear();
      this.subscriptionsByType.clear();
      this.deadLetterQueue = [];
      this.isInitialized = false;
      this.logger.info('In-memory broker shut down');
    });
  }

  async publish<_T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope,
    mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      const startTime = Date.now();

      try {
        envelope.status = EventStatus.PROCESSING;
        this.recordPublished();

        const result = await this.dispatcher.dispatch(envelope, mode);

        if (result.isSuccess) {
          envelope.status = EventStatus.PUBLISHED;
          envelope.publishedAt = new Date();
          this.recordProcessed();
        } else {
          envelope.status = EventStatus.FAILED;
          envelope.lastError = result.error;
          this.recordFailed();
          this.recordDeadLettered(envelope, result.error || new Error('Unknown error'));
        }
      } catch (error) {
        envelope.status = EventStatus.FAILED;
        const err = error instanceof Error ? error : new Error(String(error));
        envelope.lastError = err;
        this.recordFailed();
        this.recordDeadLettered(envelope, err);
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        this.recordMetric(duration);

        this.logger.debug(
          {
            eventId: envelope.metadata.eventId,
            eventType: envelope.metadata.eventType,
            status: envelope.status,
            durationMs: duration,
            mode,
          },
          'Event published'
        );
      }
    });
  }

  async publishBatch<T extends DomainEventPayload = Record<string, any>>(
    envelopes: EventEnvelope<T>[],
    mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (envelopes.length === 0) {
        return;
      }

      const startTime = Date.now();
      const errors: Error[] = [];

      for (const envelope of envelopes) {
        const result = await this.publish(envelope, mode);
        if (result.isFailure) {
          errors.push(result.error || new Error('Unknown error'));
        }
      }

      if (errors.length > 0) {
        this.logger.error(
          {
            batchSize: envelopes.length,
            failureCount: errors.length,
            errors: errors.map((e) => e.message),
          },
          'Batch publish had failures'
        );
        throw errors[0];
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        {
          batchSize: envelopes.length,
          durationMs: duration,
          averagePerEventMs: Math.round(duration / envelopes.length),
        },
        'Batch published successfully'
      );
    });
  }

  subscribe<T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: IEventHandler<T>,
    priority: number = 0
  ): string {
    const subscriptionId = this.registry.register(eventType, handler, priority);
    this.subscriptionMap.set(subscriptionId, { eventType, handler, priority });

    const eventSubscriptions = this.subscriptionsByType.get(eventType) || [];
    eventSubscriptions.push(subscriptionId);
    this.subscriptionsByType.set(eventType, eventSubscriptions);

    this.logger.debug(
      { eventType, subscriptionId, priority },
      'Handler subscribed to event type'
    );

    return subscriptionId;
  }

  async healthCheck(): Promise<IResult<{ connected: boolean; latencyMs: number }>> {
    return Result.try(() => {
      return {
        connected: this.isInitialized,
        latencyMs: 0,
      };
    });
  }

  private recordMetric(duration: number): void {
    this.processingTimes.push(duration);

    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-500);
    }

    if (this.processingTimes.length > 0) {
      const average = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
      this.metrics.averageProcessingTimeMs = average;
    }
  }
}
