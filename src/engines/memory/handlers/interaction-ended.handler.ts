import { BaseEventHandler } from '../../event/contracts/base-event-handler';
import { EventEnvelope } from '../../event/dto/event.dto';
import { Result } from '../../../services/types/result.type';
import { IMemoryEngine } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

export class InteractionEndedHandler extends BaseEventHandler<any> {
  constructor(private memoryEngine: IMemoryEngine) {
    super('INTERACTION_ENDED', 5, true);
  }

  protected async onEvent(envelope: EventEnvelope<any>): Promise<void> {
    const { conversationSummary, userId, companionId } = envelope.payload;

    if (!conversationSummary || !userId) {
      return;
    }

    const createResult = this.memoryEngine.create(
      userId,
      MemoryType.CONTEXT,
      `Interaction with companion ${companionId}`,
      conversationSummary
    );

    if (!createResult.isSuccess) {
      console.error('Failed to create memory from interaction', createResult.error);
    }
  }
}
