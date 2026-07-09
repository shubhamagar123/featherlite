import { IResult } from '@services/types/result.type';
import { EventEnvelope, DeadLetterEntry, EventMetrics, DomainEventPayload } from '../dto/event.dto';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { EventType, EventDispatchMode } from '../enums/event.enums';

/**
 * Broker adapter interface for pluggable event brokers.
 * Concrete implementations provide Kafka, RabbitMQ, AWS EventBridge, etc.
 * Engines use this through EventEngine - no code changes needed when switching brokers.
 */
export interface IBrokerAdapter {
  /**
   * Initialize broker connection and resources
   */
  initialize(): Promise<IResult<void>>;

  /**
   * Shutdown broker connection and cleanup
   */
  shutdown(): Promise<IResult<void>>;

  /**
   * Publish single event to broker
   */
  publish<T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope<T>,
    mode: EventDispatchMode
  ): Promise<IResult<void>>;

  /**
   * Publish batch of events atomically where possible
   */
  publishBatch<T extends DomainEventPayload = Record<string, any>>(
    envelopes: EventEnvelope<T>[],
    mode: EventDispatchMode
  ): Promise<IResult<void>>;

  /**
   * Subscribe handler to event type
   * Returns subscription ID for later unsubscription
   */
  subscribe<T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: IEventHandler<T>,
    priority?: number
  ): string;

  /**
   * Unsubscribe handler from event type
   */
  unsubscribe(eventType: EventType, subscriptionId: string): IResult<void>;

  /**
   * Get current dead letter queue entries
   */
  getDeadLetterQueue(): DeadLetterEntry[];

  /**
   * Get broker metrics (messages published/processed/failed)
   */
  getMetrics(): EventMetrics;

  /**
   * Health check for broker connectivity
   */
  healthCheck(): Promise<IResult<{ connected: boolean; latencyMs: number }>>;

  /**
   * Broker type identifier
   */
  getBrokerType(): string;
}
