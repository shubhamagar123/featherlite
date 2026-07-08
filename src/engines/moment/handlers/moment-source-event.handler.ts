import { BaseEventHandler } from '@engines/event';
import type { EventEnvelope, DomainEventPayload } from '@engines/event';
import { EventType } from '@engines/event';
import { IMomentEngine } from '../interfaces/moment.interfaces';

/**
 * Bridges the shared event bus to the Moment Engine. Subscribed to memory,
 * relationship, message, and conversation lifecycle events; each triggers a
 * fresh evaluation on the engine.
 */
export class MomentSourceEventHandler extends BaseEventHandler<DomainEventPayload> {
  constructor(private readonly engine: IMomentEngine, eventType: EventType) {
    super(eventType, 1, true);
  }

  protected async onEvent(envelope: EventEnvelope<DomainEventPayload>): Promise<void> {
    const userId = envelope.metadata.userId ?? (envelope.payload.userId as string | undefined);
    const companionId =
      envelope.metadata.companionId ?? (envelope.payload.companionId as string | undefined);

    if (!userId || !companionId) return;

    await this.engine.processEvent({
      userId,
      companionId,
      eventType: envelope.metadata.eventType,
      eventPayload: { ...envelope.payload, aggregateId: envelope.aggregateId },
      now: new Date(),
    });
  }
}
