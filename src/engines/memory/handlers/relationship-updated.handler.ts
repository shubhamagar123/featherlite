import { BaseEventHandler } from '../../event/contracts/base-event-handler';
import { EventEnvelope } from '../../event/dto/event.dto';
import { Result } from '../../../services/types/result.type';
import { IMemoryEngine } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

export class RelationshipUpdatedHandler extends BaseEventHandler<any> {
  constructor(private memoryEngine: IMemoryEngine) {
    super('RELATIONSHIP_UPDATED', 5, true);
  }

  protected async onEvent(envelope: EventEnvelope<any>): Promise<void> {
    const { userId, companionId, status, phase, health } = envelope.payload;

    if (!userId || !companionId) {
      return;
    }

    const description = `Relationship status: ${status}, Phase: ${phase}, Health: ${health}`;

    const createResult = this.memoryEngine.create(
      userId,
      MemoryType.RELATIONSHIP,
      `Relationship milestone with ${companionId}`,
      description
    );

    if (!createResult.isSuccess) {
      console.error('Failed to create relationship memory', createResult.error);
    }
  }
}
