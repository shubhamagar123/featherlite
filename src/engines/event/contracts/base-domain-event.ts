import { EventEnvelope, EventMetadata, EventContext, DomainEventPayload } from '../dto/event.dto';
import { EventType, EventPriority, EventStatus, AggregateType } from '../enums/event.enums';
import { randomUUID } from 'crypto';
import { getEnvironment } from '@config/environment';

export abstract class BaseDomainEvent<T extends DomainEventPayload = Record<string, any>> {
  protected envelope: EventEnvelope<T>;

  constructor(
    aggregateId: string,
    aggregateType: AggregateType,
    eventType: EventType,
    eventName: string,
    payload: T,
    context: EventContext,
    priority: EventPriority = EventPriority.NORMAL,
    version: number = 1
  ) {
    const correlationId = context.correlationId || randomUUID();
    const causationId = context.causationId;
    const traceId = context.traceId || randomUUID();

    this.envelope = {
      metadata: {
        eventId: randomUUID(),
        eventName,
        eventType,
        version,
        occurredAt: new Date(),
        correlationId,
        causationId,
        traceId,
        userId: context.userId,
        companionId: context.companionId,
        priority,
        source: 'domain',
        environment: getEnvironment().NODE_ENV,
      },
      aggregateId,
      aggregateType,
      payload,
      status: EventStatus.PENDING,
      attemptCount: 0,
    };
  }

  getEnvelope(): EventEnvelope<T> {
    return { ...this.envelope };
  }

  getMetadata(): EventMetadata {
    return { ...this.envelope.metadata };
  }

  getPayload(): T {
    return { ...this.envelope.payload };
  }

  getAggregateId(): string {
    return this.envelope.aggregateId;
  }

  getAggregateType(): AggregateType {
    return this.envelope.aggregateType;
  }

  getCorrelationId(): string {
    return this.envelope.metadata.correlationId;
  }

  getCausationId(): string | undefined {
    return this.envelope.metadata.causationId;
  }

  getTraceId(): string | undefined {
    return this.envelope.metadata.traceId;
  }

  getEventType(): EventType {
    return this.envelope.metadata.eventType;
  }

  getEventId(): string {
    return this.envelope.metadata.eventId;
  }

  getOccurredAt(): Date {
    return this.envelope.metadata.occurredAt;
  }

  getVersion(): number {
    return this.envelope.metadata.version;
  }

  getPriority(): EventPriority {
    return this.envelope.metadata.priority;
  }

  abstract validate(): boolean;
}
