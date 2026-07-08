import { BaseEventHandler } from '@engines/event';
import type { EventEnvelope } from '@engines/event';
import { EventType } from '@engines/event';
import { IMemoryOperations } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

interface MessageReceivedPayload {
  userId?: string;
  companionId?: string;
  content?: string;
}

export class MessageReceivedHandler extends BaseEventHandler<MessageReceivedPayload> {
  constructor(private readonly memoryEngine: IMemoryOperations) {
    super(EventType.MESSAGE_RECEIVED, 4, true);
  }

  protected async onEvent(envelope: EventEnvelope<MessageReceivedPayload>): Promise<void> {
    const { content, userId, companionId } = envelope.payload;

    if (!content || !userId) return;

    const hasEmotionalKeywords = /\b(love|hate|important|meaningful|remember|forget)\b/i.test(content);
    const hasPersonalInfo = /\b(name|birthday|anniversary|family|friend)\b/i.test(content);

    if (!(hasEmotionalKeywords || hasPersonalInfo)) return;

    const createResult = this.memoryEngine.create(
      userId,
      MemoryType.CONVERSATION_CALLBACK,
      `Important message from ${companionId ?? 'unknown companion'}`,
      content
    );

    if (!createResult.isSuccess) {
      this.logger.warn(
        { err: createResult.error, eventId: envelope.metadata.eventId, userId, companionId },
        'Failed to create memory from message'
      );
    }
  }
}
