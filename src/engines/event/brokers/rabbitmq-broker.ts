import { BaseBrokerAdapter } from './broker-adapter.base';
import { IResult, Result } from '@services/types/result.type';
import { EventEnvelope, DomainEventPayload, EventRetryPolicy } from '../dto/event.dto';
import { EventType, EventDispatchMode, EventStatus } from '../enums/event.enums';
import * as amqp from 'amqplib';

interface RabbitMQBrokerConfig {
  url: string;
  exchangeName?: string;
  queuePrefix?: string;
  retryPolicy?: EventRetryPolicy;
  prefetch?: number;
}

/**
 * RabbitMQ broker adapter.
 * Uses topic exchange with routing keys per event type for flexible message routing.
 * Supports multiple consumers per event type via durable queues.
 */
export class RabbitMQBroker extends BaseBrokerAdapter {
  private connection: any = null;
  private channel: any = null;
  private readonly config: RabbitMQBrokerConfig;
  private isInitialized = false;
  private activeQueues: Map<EventType, boolean> = new Map();

  constructor(config: RabbitMQBrokerConfig) {
    super('RabbitMQ');
    this.config = {
      exchangeName: 'featherlight.events',
      queuePrefix: 'featherlight.queue',
      prefetch: 10,
      ...config,
    };
  }

  async initialize(): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (this.isInitialized) return;

      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.config.exchangeName!, 'topic', { durable: true });
      await this.channel.prefetch(this.config.prefetch!);

      this.connection.once('error', (error: any) => {
        this.logger.error({ error }, 'RabbitMQ connection error');
      });

      this.connection.once('close', () => {
        this.logger.warn('RabbitMQ connection closed');
      });

      this.isInitialized = true;
      this.logger.info({ url: this.config.url }, 'RabbitMQ broker initialized');
    });
  }

  async shutdown(): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (!this.isInitialized) return;

      try {
        await this.channel?.close();
        await this.connection?.close();
      } catch (error) {
        this.logger.error({ error }, 'Error closing RabbitMQ connection');
      }

      this.isInitialized = false;
      this.logger.info('RabbitMQ broker shut down');
    });
  }

  async publish<_T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope,
    mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not initialized');
      }

      const startTime = Date.now();
      const routingKey = this.getRoutingKey(envelope.metadata.eventType);
      const message = Buffer.from(JSON.stringify(envelope));

      this.channel.publish(this.config.exchangeName!, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
        headers: {
          'x-event-type': envelope.metadata.eventType,
          'x-event-id': envelope.metadata.eventId,
          'x-correlation-id': envelope.metadata.correlationId,
          'x-causation-id': envelope.metadata.causationId || '',
        },
      });

      envelope.status = EventStatus.PUBLISHED;
      envelope.publishedAt = new Date();
      this.recordPublished();

      const duration = Date.now() - startTime;
      this.metrics.averageProcessingTimeMs =
        (this.metrics.averageProcessingTimeMs * this.metrics.published + duration) /
        (this.metrics.published + 1);

      this.logger.debug(
        { routingKey, eventId: envelope.metadata.eventId, durationMs: duration },
        'Event published to RabbitMQ'
      );

      if (mode === EventDispatchMode.ASYNC) {
        await this.subscribeToQueue(envelope.metadata.eventType);
      }
    });
  }

  async publishBatch<_T extends DomainEventPayload = Record<string, any>>(
    envelopes: EventEnvelope[],
    _mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not initialized');
      }

      if (envelopes.length === 0) return;

      const startTime = Date.now();

      for (const envelope of envelopes) {
        const routingKey = this.getRoutingKey(envelope.metadata.eventType);
        const message = Buffer.from(JSON.stringify(envelope));

        this.channel.publish(this.config.exchangeName!, routingKey, message, {
          persistent: true,
          contentType: 'application/json',
          headers: {
            'x-event-type': envelope.metadata.eventType,
            'x-event-id': envelope.metadata.eventId,
            'x-correlation-id': envelope.metadata.correlationId,
            'x-causation-id': envelope.metadata.causationId || '',
          },
        });

        envelope.status = EventStatus.PUBLISHED;
        envelope.publishedAt = new Date();
        this.recordPublished();
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        {
          batchSize: envelopes.length,
          durationMs: duration,
          averagePerEventMs: Math.round(duration / envelopes.length),
        },
        'Batch published to RabbitMQ'
      );
    });
  }

  subscribe<_T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: any,
    priority: number = 0
  ): string {
    const subscriptionId = super.subscribe(eventType, handler, priority);

    void this.subscribeToQueue(eventType);

    return subscriptionId;
  }

  private async subscribeToQueue(eventType: EventType): Promise<void> {
    if (!this.channel || this.activeQueues.get(eventType)) {
      return;
    }

    const queueName = `${this.config.queuePrefix}.${eventType.toLowerCase()}`;
    const routingKey = this.getRoutingKey(eventType);

    try {
      await this.channel.assertQueue(queueName, { durable: true });
      await this.channel.bindQueue(queueName, this.config.exchangeName!, routingKey);

      this.activeQueues.set(eventType, true);

      await this.channel.consume(queueName, async (message: any) => {
        if (!message) return;

        try {
          const envelope = JSON.parse(message.content.toString()) as EventEnvelope;
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

          this.channel?.ack(message);
        } catch (error) {
          this.logger.error({ error }, 'Failed to process RabbitMQ message');
          this.channel?.nack(message, false, true);
        }
      });
    } catch (error) {
      this.logger.error({ error, queueName }, 'Failed to subscribe to RabbitMQ queue');
    }
  }

  async healthCheck(): Promise<IResult<{ connected: boolean; latencyMs: number }>> {
    return Result.tryAsync(async () => {
      if (!this.channel) {
        return { connected: false, latencyMs: 0 };
      }

      const startTime = Date.now();
      await this.channel.checkExchange(this.config.exchangeName!);

      return {
        connected: true,
        latencyMs: Date.now() - startTime,
      };
    });
  }

  private getRoutingKey(eventType: EventType): string {
    return `events.${eventType.toLowerCase()}`;
  }
}
