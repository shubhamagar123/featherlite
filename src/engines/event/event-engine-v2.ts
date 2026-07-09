import { IResult, Result } from '@services/types/result.type';
import { IEventBus, IEventPublisher, IEventSubscriber } from './interfaces/event-bus.interface';
import { IEventHandler } from './interfaces/event-handler.interface';
import { EventEnvelope, DomainEventPayload, EventMetrics, EventRetryPolicy, DeadLetterEntry } from './dto/event.dto';
import { EventType, EventDispatchMode } from './enums/event.enums';
import { IBrokerAdapter } from './brokers/broker-adapter.interface';
import { BrokerFactory, BrokerFactoryConfig } from './brokers/broker-factory';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

/**
 * Broker-agnostic EventEngine v2.
 *
 * Key difference from v1:
 * - Uses pluggable IBrokerAdapter instead of hardcoded EventBus
 * - Brokers can be switched at runtime via configuration
 * - No code changes needed when changing brokers (Kafka, RabbitMQ, EventBridge, InMemory)
 * - API remains identical to EventEngine v1 for backward compatibility
 *
 * Usage:
 * const engine = new EventEngineV2(brokerConfig);
 * await engine.initialize();
 * // Use like EventEngine v1
 */
export class EventEngineV2 implements IEventBus, IEventPublisher, IEventSubscriber {
  private broker: IBrokerAdapter;
  private readonly logger: Logger;
  private isInitialized = false;

  constructor(brokerConfig?: BrokerFactoryConfig, retryPolicy?: EventRetryPolicy) {
    this.logger = createLogger('EventEngineV2');

    // If no config provided, create from environment
    if (!brokerConfig) {
      this.broker = BrokerFactory.createFromEnvironment(retryPolicy);
    } else {
      this.broker = BrokerFactory.createBroker({
        ...brokerConfig,
        retryPolicy,
      });
    }
  }

  async initialize(): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (this.isInitialized) return;

      const result = await this.broker.initialize();
      if (result.isFailure) {
        throw result.error;
      }

      this.isInitialized = true;
      this.logger.info(
        { brokerType: this.broker.getBrokerType() },
        'EventEngineV2 initialized'
      );
    });
  }

  async shutdown(): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (!this.isInitialized) return;

      const result = await this.broker.shutdown();
      if (result.isFailure) {
        throw result.error;
      }

      this.isInitialized = false;
      this.logger.info('EventEngineV2 shut down');
    });
  }

  async publish<T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope<T>,
    mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    if (!this.isInitialized) {
      return Result.failure(new Error('EventEngineV2 not initialized'));
    }

    return this.broker.publish(envelope, mode);
  }

  async publishBatch<T extends DomainEventPayload = Record<string, any>>(
    envelopes: EventEnvelope<T>[],
    mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    if (!this.isInitialized) {
      return Result.failure(new Error('EventEngineV2 not initialized'));
    }

    return this.broker.publishBatch(envelopes, mode);
  }

  subscribe<T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: IEventHandler<T>,
    priority?: number
  ): string {
    return this.broker.subscribe(eventType, handler, priority);
  }

  unsubscribe(eventType: EventType, subscriptionId: string): IResult<void> {
    return this.broker.unsubscribe(eventType, subscriptionId);
  }

  getDeadLetterQueue(): DeadLetterEntry[] {
    return this.broker.getDeadLetterQueue();
  }

  getMetrics(): EventMetrics {
    return this.broker.getMetrics();
  }

  getBrokerType(): string {
    return this.broker.getBrokerType();
  }

  async healthCheck(): Promise<IResult<{ connected: boolean; latencyMs: number }>> {
    return this.broker.healthCheck();
  }

  reset(): void {
    // Reset is broker-specific, so we don't expose it in this version
    // Brokers manage their own state
    this.logger.warn('reset() not supported in EventEngineV2; implement broker-specific reset if needed');
  }
}

/**
 * Alias for backward compatibility.
 * New code should use EventEngineV2 directly.
 */
export type EventEngine = EventEngineV2;
