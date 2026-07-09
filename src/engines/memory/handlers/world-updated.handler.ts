import { BaseEventHandler } from '@engines/event';
import type { EventEnvelope } from '@engines/event';
import { EventType } from '@engines/event';
import { IMemoryOperations } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

interface WorldUpdatedPayload {
  userId?: string;
  companionId?: string;
  updates?: Record<string, unknown>;
}

/**
 * Consumes WORLD_UPDATED events and creates memory records for world state
 * changes.
 *
 * Idempotency: Relies on BaseEventHandler's ProcessedEvents table for
 * exactly-once delivery. Each handler invocation is recorded atomically.
 */
export class WorldUpdatedHandler extends BaseEventHandler<WorldUpdatedPayload> {
  constructor(private readonly memoryEngine: IMemoryOperations) {
    super(EventType.WORLD_UPDATED, 4, true);
  }

  protected async onEvent(envelope: EventEnvelope<WorldUpdatedPayload>): Promise<void> {
    const { userId, companionId, updates } = envelope.payload;

    if (!userId || !companionId || !updates) return;

    const description = `Companion's world state updated: ${JSON.stringify(updates)}`;

    const createResult = this.memoryEngine.create(
      userId,
      MemoryType.CONTEXT,
      `World state for ${companionId}`,
      description
    );

    if (!createResult.isSuccess) {
      this.logger.warn(
        { err: createResult.error, eventId: envelope.metadata.eventId, userId, companionId },
        'Failed to create world memory'
      );
    }
  }
}
