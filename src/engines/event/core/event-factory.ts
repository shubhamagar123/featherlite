import { EventEnvelope, EventMetadata, EventContext, DomainEventPayload } from '../dto/event.dto';
import { EventType, EventPriority, EventStatus, AggregateType } from '../enums/event.enums';
import { randomUUID } from 'crypto';

export class EventFactory {
  static createEnvelope<T extends DomainEventPayload = Record<string, any>>(
    aggregateId: string,
    aggregateType: AggregateType,
    eventType: EventType,
    eventName: string,
    payload: T,
    context: EventContext,
    priority: EventPriority = EventPriority.NORMAL,
    version: number = 1
  ): EventEnvelope<T> {
    const correlationId = context.correlationId || randomUUID();

    return {
      metadata: {
        eventId: randomUUID(),
        eventName,
        eventType,
        version,
        occurredAt: new Date(),
        correlationId,
        causationId: context.causationId,
        traceId: context.traceId || randomUUID(),
        userId: context.userId,
        companionId: context.companionId,
        priority,
        source: 'domain',
        environment: process.env.NODE_ENV || 'development',
      },
      aggregateId,
      aggregateType,
      payload,
      status: EventStatus.PENDING,
      attemptCount: 0,
    };
  }

  static createMetadata(
    eventName: string,
    eventType: EventType,
    context: EventContext,
    priority: EventPriority = EventPriority.NORMAL,
    version: number = 1
  ): EventMetadata {
    const correlationId = context.correlationId || randomUUID();

    return {
      eventId: randomUUID(),
      eventName,
      eventType,
      version,
      occurredAt: new Date(),
      correlationId,
      causationId: context.causationId,
      traceId: context.traceId || randomUUID(),
      userId: context.userId,
      companionId: context.companionId,
      priority,
      source: 'domain',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  static withCausation<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    causationId: string
  ): EventEnvelope<T> {
    return {
      ...envelope,
      metadata: {
        ...envelope.metadata,
        causationId,
      },
    };
  }

  static withPriority<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    priority: EventPriority
  ): EventEnvelope<T> {
    return {
      ...envelope,
      metadata: {
        ...envelope.metadata,
        priority,
      },
    };
  }

  static withVersion<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    version: number
  ): EventEnvelope<T> {
    return {
      ...envelope,
      metadata: {
        ...envelope.metadata,
        version,
      },
    };
  }
}
