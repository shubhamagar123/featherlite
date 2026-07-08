import { BaseEventHandler } from '../../event/contracts/base-event-handler';
import { EventEnvelope } from '../../event/dto/event.dto';
import { Result } from '../../../services/types/result.type';
import { IMemoryEngine } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

export class WorldUpdatedHandler extends BaseEventHandler<any> {
  constructor(private memoryEngine: IMemoryEngine) {
    super('WORLD_UPDATED', 4, true);
  }

  protected async onEvent(envelope: EventEnvelope<any>): Promise<void> {
    const { userId, companionId, updates } = envelope.payload;

    if (!userId || !companionId || !updates) {
      return;
    }

    const description = `Companion's world state updated: ${JSON.stringify(updates)}`;

    const createResult = this.memoryEngine.create(
      userId,
      MemoryType.CONTEXT,
      `World state for ${companionId}`,
      description
    );

    if (!createResult.isSuccess) {
      console.error('Failed to create world memory', createResult.error);
    }
  }
}
