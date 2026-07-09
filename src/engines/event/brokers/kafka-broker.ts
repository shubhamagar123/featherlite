import { BaseBrokerAdapter } from './broker-adapter.base';
import { IResult, Result } from '@services/types/result.type';
import { EventEnvelope, DomainEventPayload, EventRetryPolicy } from '../dto/event.dto';
import { EventType, EventDispatchMode, EventStatus } from '../enums/event.enums';
import { Kafka, Producer, Consumer, KafkaMessage } from 'kafkajs';

interface KafkaBrokerConfig {
  brokers: string[];
  clientId: string;
  retryPolicy?: EventRetryPolicy;
  consumerGroupId?: string;
  autoCommit?: boolean;
}

/**
 * Apache Kafka broker adapter.
 * Uses topic per event type for scalable distributed event processing.
 * Supports async dispatch with consumer groups for parallel processing.
 */
export class KafkaBroker extends BaseBrokerAdapter {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private readonly config: KafkaBrokerConfig;
  private isInitialized = false;
  private activeConsumers: Map<EventType, boolean> = new Map();

  constructor(config: KafkaBrokerConfig) {
    super('Kafka');
    this.config = {
      consumerGroupId: 'featherlight-events',
      autoCommit: true,
      ...config,
    };

    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
    });
  }

  async initialize(): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (this.isInitialized) return;

      this.producer = this.kafka.producer();
      this.consumer = this.kafka.consumer({
        groupId: this.config.consumerGroupId!,
      });

      await this.producer.connect();
      await this.consumer.connect();

      this.isInitialized = true;
      this.logger.info(
        { brokers: this.config.brokers, clientId: this.config.clientId },
        'Kafka broker initialized'
      );
    });
  }

  async shutdown(): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (!this.isInitialized) return;

      for (const [, isActive] of this.activeConsumers) {
        if (isActive) {
          await this.consumer?.disconnect();
          break;
        }
      }

      await this.producer?.disconnect();
      await this.consumer?.disconnect();

      this.isInitialized = false;
      this.logger.info('Kafka broker shut down');
    });
  }

  async publish<_T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope,
    _mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (!this.producer) {
        throw new Error('Kafka producer not initialized');
      }

      const startTime = Date.now();
      const topic = this.getTopicForEventType(envelope.metadata.eventType);
      const message: KafkaMessage = {
        key: envelope.metadata.correlationId,
        value: Buffer.from(JSON.stringify(envelope)),
        headers: {
          'event-type': envelope.metadata.eventType as any,
          'event-id': envelope.metadata.eventId as any,
          'correlation-id': envelope.metadata.correlationId as any,
          'causation-id': (envelope.metadata.causationId || '') as any,
        },
      };

      await this.producer.send({
        topic,
        messages: [message],
        timeout: 10000,
      });

      envelope.status = EventStatus.PUBLISHED;
      envelope.publishedAt = new Date();
      this.recordPublished();

      const duration = Date.now() - startTime;
      this.metrics.averageProcessingTimeMs =
        (this.metrics.averageProcessingTimeMs * this.metrics.published + duration) /
        (this.metrics.published + 1);

      this.logger.debug(
        { topic, eventId: envelope.metadata.eventId, durationMs: duration },
        'Event published to Kafka'
      );

      if (_mode === EventDispatchMode.ASYNC) {
        await this.subscribeToTopic(envelope.metadata.eventType);
      }
    });
  }

  async publishBatch<_T extends DomainEventPayload = Record<string, any>>(
    envelopes: EventEnvelope[],
    _mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (!this.producer) {
        throw new Error('Kafka producer not initialized');
      }

      if (envelopes.length === 0) return;

      const startTime = Date.now();
      const messagesByTopic: Map<string, KafkaMessage[]> = new Map();

      for (const envelope of envelopes) {
        const topic = this.getTopicForEventType(envelope.metadata.eventType);
        const messages = messagesByTopic.get(topic) || [];
        messages.push({
          key: envelope.metadata.correlationId,
          value: Buffer.from(JSON.stringify(envelope)),
          headers: {
            'event-type': envelope.metadata.eventType as any,
            'event-id': envelope.metadata.eventId as any,
            'correlation-id': envelope.metadata.correlationId as any,
            'causation-id': (envelope.metadata.causationId || '') as any,
          },
        });
        messagesByTopic.set(topic, messages);
      }

      for (const [topic, messages] of messagesByTopic) {
        await this.producer.send({
          topic,
          messages,
          timeout: 10000,
        });
      }

      for (const envelope of envelopes) {
        envelope.status = EventStatus.PUBLISHED;
        envelope.publishedAt = new Date();
        this.recordPublished();
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        {
          batchSize: envelopes.length,
          topicCount: messagesByTopic.size,
          durationMs: duration,
        },
        'Batch published to Kafka'
      );
    });
  }

  subscribe<_T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: any,
    priority: number = 0
  ): string {
    const subscriptionId = super.subscribe(eventType, handler, priority);

    void this.subscribeToTopic(eventType);

    return subscriptionId;
  }

  private async subscribeToTopic(eventType: EventType): Promise<void> {
    if (!this.consumer || this.activeConsumers.get(eventType)) {
      return;
    }

    const topic = this.getTopicForEventType(eventType);

    try {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      this.activeConsumers.set(eventType, true);

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          try {
            const envelope = JSON.parse(message.value?.toString() || '{}') as EventEnvelope;
            const handlers = this.getHandlersForEvent(envelope.metadata.eventType);

            for (const handler of handlers) {
              try {
                await handler.handle(envelope);
                this.recordProcessed();
              } catch (error) {
                this.recordFailed();
                this.recordDeadLettered(
                  envelope,
                  error instanceof Error ? error : new Error(String(error))
                );
              }
            }
          } catch (error) {
            this.logger.error({ error }, 'Failed to process Kafka message');
          }
        },
      });
    } catch (error) {
      this.logger.error({ error, topic }, 'Failed to subscribe to Kafka topic');
    }
  }

  async healthCheck(): Promise<IResult<{ connected: boolean; latencyMs: number }>> {
    return Result.tryAsync(async () => {
      if (!this.producer) {
        return { connected: false, latencyMs: 0 };
      }

      const startTime = Date.now();
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.fetchTopicMetadata();
      await admin.disconnect();

      return {
        connected: true,
        latencyMs: Date.now() - startTime,
      };
    });
  }

  private getTopicForEventType(eventType: EventType): string {
    return `events.${eventType.toLowerCase()}`;
  }
}
