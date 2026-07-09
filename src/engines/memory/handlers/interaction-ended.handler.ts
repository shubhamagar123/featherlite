import { BaseEventHandler } from '@engines/event';
import type { EventEnvelope } from '@engines/event';
import { EventType } from '@engines/event';
import { IMemoryOperations } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

interface InteractionEndedPayload {
  userId?: string;
  companionId?: string;
  conversationSummary?: string;
}

/**
 * Consumes INTERACTION_ENDED events and creates memory records from
 * conversation summaries.
 *
 * Idempotency: Relies on BaseEventHandler's ProcessedEvents table for
 * exactly-once delivery. Each handler invocation is recorded atomically.
 */
export class InteractionEndedHandler extends BaseEventHandler<InteractionEndedPayload> {
  constructor(private readonly memoryEngine: IMemoryOperations) {
    super(EventType.INTERACTION_ENDED, 5, true);
  }

  protected async onEvent(envelope: EventEnvelope<InteractionEndedPayload>): Promise<void> {
    const { conversationSummary, userId, companionId } = envelope.payload;

    if (!conversationSummary || !userId) return;

    const createResult = this.memoryEngine.create(
      userId,
      MemoryType.CONTEXT,
      `Interaction with companion ${companionId ?? 'unknown companion'}`,
      conversationSummary
    );

    if (!createResult.isSuccess) {
      this.logger.warn(
        { err: createResult.error, eventId: envelope.metadata.eventId, userId, companionId },
        'Failed to create memory from interaction'
      );
    }
  }
}
