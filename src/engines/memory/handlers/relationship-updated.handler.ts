import { BaseEventHandler } from '@engines/event';
import type { EventEnvelope } from '@engines/event';
import { EventType } from '@engines/event';
import { IMemoryOperations } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

interface RelationshipUpdatedPayload {
  userId?: string;
  companionId?: string;
  status?: string;
  phase?: string;
  health?: number;
}

/**
 * Consumes RELATIONSHIP_UPDATED events and creates corresponding memory records.
 *
 * Idempotency: Relies on BaseEventHandler's ProcessedEvents table for
 * exactly-once delivery. Each handler invocation is recorded atomically.
 */
export class RelationshipUpdatedHandler extends BaseEventHandler<RelationshipUpdatedPayload> {
  constructor(private readonly memoryEngine: IMemoryOperations) {
    super(EventType.RELATIONSHIP_UPDATED, 5, true);
  }

  protected async onEvent(envelope: EventEnvelope<RelationshipUpdatedPayload>): Promise<void> {
    const { userId, companionId, status, phase, health } = envelope.payload;

    if (!userId || !companionId) return;

    const description = `Relationship status: ${status}, Phase: ${phase}, Health: ${health}`;

    const createResult = this.memoryEngine.create(
      userId,
      MemoryType.RELATIONSHIP,
      `Relationship milestone with ${companionId}`,
      description
    );

    if (!createResult.isSuccess) {
      this.logger.warn(
        { err: createResult.error, eventId: envelope.metadata.eventId, userId, companionId },
        'Failed to create relationship memory'
      );
    }
  }
}
