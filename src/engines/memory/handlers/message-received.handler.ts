import { BaseEventHandler } from '../../event/contracts/base-event-handler';
import { EventEnvelope } from '../../event/dto/event.dto';
import { Result } from '../../../services/types/result.type';
import { IMemoryEngine } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

export class MessageReceivedHandler extends BaseEventHandler<any> {
  constructor(private memoryEngine: IMemoryEngine) {
    super('MESSAGE_RECEIVED', 4, true);
  }

  protected async onEvent(envelope: EventEnvelope<any>): Promise<void> {
    const { content, userId, companionId } = envelope.payload;

    if (!content || !userId) {
      return;
    }

    const hasEmotionalKeywords = /\b(love|hate|important|meaningful|remember|forget)\b/i.test(content);
    const hasPersonalInfo = /\b(name|birthday|anniversary|family|friend)\b/i.test(content);

    if (hasEmotionalKeywords || hasPersonalInfo) {
      const createResult = this.memoryEngine.create(
        userId,
        MemoryType.CONVERSATION_CALLBACK,
        `Important message from ${companionId}`,
        content
      );

      if (!createResult.isSuccess) {
        console.error('Failed to create memory from message', createResult.error);
      }
    }
  }
}
