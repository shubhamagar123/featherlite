import { IBrokerAdapter } from './broker-adapter.interface';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { EventEnvelope, DeadLetterEntry, EventMetrics, DomainEventPayload } from '../dto/event.dto';
import { EventType, EventDispatchMode } from '../enums/event.enums';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { IResult, Result } from '@services/types/result.type';
import { DeadLetterEventsRepository } from '@database/repositories/dead-letter-events.repository';

/**
 * Base class for all broker adapters.
 * Provides common functionality like metrics tracking, dead letter handling, and logging.
 */
export abstract class BaseBrokerAdapter implements IBrokerAdapter {
  protected readonly logger: Logger;
  protected readonly deadLetterRepository: DeadLetterEventsRepository;
  protected deadLetterQueue: DeadLetterEntry[] = [];
  protected metrics: EventMetrics = {
    published: 0,
    processed: 0,
    failed: 0,
    retried: 0,
    deadLettered: 0,
    averageProcessingTimeMs: 0,
  };

  protected subscriptionMap: Map<string, { eventType: EventType; handler: IEventHandler; priority: number }> =
    new Map();

  protected subscriptionsByType: Map<EventType, string[]> = new Map();

  constructor(protected readonly brokerType: string) {
    this.logger = createLogger(`${this.brokerType}BrokerAdapter`);
    this.deadLetterRepository = new DeadLetterEventsRepository();
  }

  abstract initialize(): Promise<IResult<void>>;
  abstract shutdown(): Promise<IResult<void>>;

  abstract publish<T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope<T>,
    mode: EventDispatchMode
  ): Promise<IResult<void>>;

  abstract publishBatch<T extends DomainEventPayload = Record<string, any>>(
    envelopes: EventEnvelope<T>[],
    mode: EventDispatchMode
  ): Promise<IResult<void>>;

  subscribe<T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: IEventHandler<T>,
    priority: number = 0
  ): string {
    const subscriptionId = `${eventType}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

    this.subscriptionMap.set(subscriptionId, {
      eventType,
      handler,
      priority,
    });

    const eventSubscriptions = this.subscriptionsByType.get(eventType) || [];
    eventSubscriptions.push(subscriptionId);
    this.subscriptionsByType.set(eventType, eventSubscriptions);

    this.logger.debug(
      { eventType, subscriptionId, priority },
      'Handler subscribed to event type'
    );

    return subscriptionId;
  }

  unsubscribe(eventType: EventType, subscriptionId: string): IResult<void> {
    const subscription = this.subscriptionMap.get(subscriptionId);

    if (!subscription) {
      return Result.failure(new Error(`Subscription not found: ${subscriptionId}`));
    }

    this.subscriptionMap.delete(subscriptionId);

    const eventSubscriptions = this.subscriptionsByType.get(eventType) || [];
    const index = eventSubscriptions.indexOf(subscriptionId);
    if (index > -1) {
      eventSubscriptions.splice(index, 1);
    }

    this.logger.debug(
      { eventType, subscriptionId },
      'Handler unsubscribed from event type'
    );

    return Result.success(undefined);
  }

  protected getHandlersForEvent(eventType: EventType): IEventHandler[] {
    const subscriptionIds = this.subscriptionsByType.get(eventType) || [];
    return subscriptionIds
      .map((id) => this.subscriptionMap.get(id))
      .filter((sub) => sub !== undefined)
      .sort((a, b) => (b?.priority ?? 0) - (a?.priority ?? 0))
      .map((sub) => sub!.handler);
  }

  protected recordPublished(): void {
    this.metrics.published++;
  }

  protected recordProcessed(): void {
    this.metrics.processed++;
  }

  protected recordFailed(): void {
    this.metrics.failed++;
  }

  protected recordDeadLettered(envelope: EventEnvelope, error: Error): void {
    this.metrics.deadLettered++;
    const entry: DeadLetterEntry = {
      envelope,
      reason: error.message,
      timestamp: new Date(),
    };
    this.deadLetterQueue.push(entry);
    if (this.deadLetterQueue.length > 1000) {
      this.deadLetterQueue.shift();
    }

    this.persistDeadLetterEvent(entry).catch((err) => {
      this.logger.error(
        { error: err, eventId: envelope.metadata.eventId },
        'Failed to persist dead letter event to database'
      );
    });
  }

  private async persistDeadLetterEvent(entry: DeadLetterEntry): Promise<void> {
    try {
      await this.deadLetterRepository.recordFailedEvent(entry);
      this.logger.debug(
        { eventId: entry.envelope.metadata.eventId },
        'Dead letter event persisted to database'
      );
    } catch (error) {
      this.logger.warn(
        { error, eventId: entry.envelope.metadata.eventId },
        'Could not persist dead letter event (continuing with in-memory storage)'
      );
    }
  }

  getDeadLetterQueue(): DeadLetterEntry[] {
    return [...this.deadLetterQueue];
  }

  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  getBrokerType(): string {
    return this.brokerType;
  }

  abstract healthCheck(): Promise<IResult<{ connected: boolean; latencyMs: number }>>;
}
