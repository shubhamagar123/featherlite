import { EventEnvelope, DomainEventPayload } from '../dto/event.dto';
import { EventStatus } from '../enums/event.enums';

export class EventSerializer {
  static serialize<T extends DomainEventPayload>(envelope: EventEnvelope<T>): string {
    const data = {
      ...envelope,
      metadata: {
        ...envelope.metadata,
        occurredAt: envelope.metadata.occurredAt.toISOString(),
      },
      publishedAt: envelope.publishedAt?.toISOString(),
      handledAt: envelope.handledAt?.toISOString(),
      lastError: envelope.lastError?.message,
    };

    return JSON.stringify(data);
  }

  static deserialize<T extends DomainEventPayload>(json: string): EventEnvelope<T> {
    const data = JSON.parse(json);

    return {
      ...data,
      metadata: {
        ...data.metadata,
        occurredAt: new Date(data.metadata.occurredAt),
      },
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      handledAt: data.handledAt ? new Date(data.handledAt) : undefined,
      lastError: data.lastError ? new Error(data.lastError) : undefined,
    };
  }

  static toJSON<T extends DomainEventPayload>(envelope: EventEnvelope<T>): Record<string, any> {
    return {
      metadata: {
        ...envelope.metadata,
        occurredAt: envelope.metadata.occurredAt.toISOString(),
      },
      aggregateId: envelope.aggregateId,
      aggregateType: envelope.aggregateType,
      payload: envelope.payload,
      status: envelope.status,
      attemptCount: envelope.attemptCount,
      publishedAt: envelope.publishedAt?.toISOString(),
      handledAt: envelope.handledAt?.toISOString(),
    };
  }
}
