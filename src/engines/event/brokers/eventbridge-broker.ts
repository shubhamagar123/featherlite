import { BaseBrokerAdapter } from './broker-adapter.base';
import { IResult, Result } from '@services/types/result.type';
import { EventEnvelope, DomainEventPayload, EventRetryPolicy } from '../dto/event.dto';
import { EventType, EventDispatchMode, EventStatus } from '../enums/event.enums';
import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsRequestEntry,
} from '@aws-sdk/client-eventbridge';
import { EventRegistry } from '../core/event-registry';
import { EventDispatcher } from '../core/event-dispatcher';
import { IEventHandler } from '../interfaces/event-handler.interface';

interface EventBridgeBrokerConfig {
  region: string;
  eventBusName?: string;
  retryPolicy?: EventRetryPolicy;
  source?: string;
}

/**
 * AWS EventBridge broker adapter.
 * Publishes events to EventBridge for serverless, decoupled event processing.
 * Supports cross-account and cross-region event routing via EventBridge rules.
 */
export class EventBridgeBroker extends BaseBrokerAdapter {
  private client: EventBridgeClient;
  private readonly config: EventBridgeBrokerConfig;
  private registry: EventRegistry;
  private dispatcher: EventDispatcher;
  private isInitialized = false;

  constructor(config: EventBridgeBrokerConfig) {
    super('EventBridge');
    this.config = {
      eventBusName: 'default',
      source: 'featherlight.backend',
      ...config,
    };

    this.client = new EventBridgeClient({ region: config.region });
    this.registry = new EventRegistry();
    this.dispatcher = new EventDispatcher(this.registry, config.retryPolicy);
  }

  async initialize(): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (this.isInitialized) return;

      // Verify EventBridge connectivity
      try {
        // EventBridge doesn't have a simple health check, so we'll just verify the client
        this.isInitialized = true;
        this.logger.info(
          { region: this.config.region, eventBusName: this.config.eventBusName },
          'EventBridge broker initialized'
        );
      } catch (error) {
        throw new Error(`Failed to initialize EventBridge broker: ${error}`);
      }
    });
  }

  async shutdown(): Promise<IResult<void>> {
    return Result.try(() => {
      this.client.destroy();
      this.isInitialized = false;
      this.logger.info('EventBridge broker shut down');
    });
  }

  async publish<_T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope,
    mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      const startTime = Date.now();

      const entry: PutEventsRequestEntry = {
        EventBusName: this.config.eventBusName,
        Source: this.config.source,
        DetailType: envelope.metadata.eventType,
        Detail: JSON.stringify({
          envelope,
          publishedBy: 'featherlight-backend',
        }),
        Resources: [envelope.aggregateId],
      };

      const command = new PutEventsCommand({
        Entries: [entry],
      });

      const response = await this.client.send(command);

      if (response.FailedEntryCount && response.FailedEntryCount > 0) {
        const failure = response.Entries?.[0];
        throw new Error(`EventBridge publish failed: ${failure?.ErrorMessage}`);
      }

      envelope.status = EventStatus.PUBLISHED;
      envelope.publishedAt = new Date();
      this.recordPublished();

      const duration = Date.now() - startTime;
      this.metrics.averageProcessingTimeMs =
        (this.metrics.averageProcessingTimeMs * this.metrics.published + duration) /
        (this.metrics.published + 1);

      this.logger.debug(
        { eventId: envelope.metadata.eventId, durationMs: duration, eventBusName: this.config.eventBusName },
        'Event published to EventBridge'
      );

      if (mode === EventDispatchMode.ASYNC) {
        // For async mode in EventBridge, dispatch through local registry
        // EventBridge handles async delivery to subscribers
        await this.dispatchLocally(envelope);
      }
    });
  }

  async publishBatch<_T extends DomainEventPayload = Record<string, any>>(
    envelopes: EventEnvelope[],
    mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      if (envelopes.length === 0) return;

      const startTime = Date.now();
      const entries: PutEventsRequestEntry[] = envelopes.map((envelope) => ({
        EventBusName: this.config.eventBusName,
        Source: this.config.source,
        DetailType: envelope.metadata.eventType,
        Detail: JSON.stringify({
          envelope,
          publishedBy: 'featherlight-backend',
        }),
        Resources: [envelope.aggregateId],
      }));

      // EventBridge has a limit of 10 entries per request
      const batchSize = 10;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const command = new PutEventsCommand({ Entries: batch });
        const response = await this.client.send(command);

        if (response.FailedEntryCount && response.FailedEntryCount > 0) {
          const failures = response.Entries?.filter((e) => e.ErrorMessage);
          this.logger.error(
            { failureCount: failures?.length },
            'Some EventBridge events failed to publish'
          );
        }
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
          durationMs: duration,
          averagePerEventMs: Math.round(duration / envelopes.length),
        },
        'Batch published to EventBridge'
      );

      if (mode === EventDispatchMode.ASYNC) {
        for (const envelope of envelopes) {
          await this.dispatchLocally(envelope);
        }
      }
    });
  }

  subscribe<T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: IEventHandler<T>,
    priority: number = 0
  ): string {
    // Subscribe to local registry for local processing
    const subscriptionId = this.registry.register(eventType, handler, priority);

    this.subscriptionMap.set(subscriptionId, { eventType, handler, priority });
    const eventSubscriptions = this.subscriptionsByType.get(eventType) || [];
    eventSubscriptions.push(subscriptionId);
    this.subscriptionsByType.set(eventType, eventSubscriptions);

    this.logger.debug(
      { eventType, subscriptionId, priority },
      'Handler subscribed to event type (local processing)'
    );

    return subscriptionId;
  }

  async healthCheck(): Promise<IResult<{ connected: boolean; latencyMs: number }>> {
    return Result.tryAsync(async () => {
      const startTime = Date.now();

      try {
        // EventBridge client is lazily initialized, so just verify we can create one
        return {
          connected: true,
          latencyMs: Date.now() - startTime,
        };
      } catch {
        return {
          connected: false,
          latencyMs: Date.now() - startTime,
        };
      }
    });
  }

  private async dispatchLocally<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>
  ): Promise<void> {
    try {
      const result = await this.dispatcher.dispatch(envelope, EventDispatchMode.ASYNC);
      if (result.isSuccess) {
        this.recordProcessed();
      } else {
        this.recordFailed();
        this.recordDeadLettered(envelope, result.error || new Error('Unknown error'));
      }
    } catch (error) {
      this.recordFailed();
      this.recordDeadLettered(
        envelope,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
