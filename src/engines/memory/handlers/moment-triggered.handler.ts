import { BaseEventHandler } from '../../event/contracts/base-event-handler';
import { EventEnvelope } from '../../event/dto/event.dto';
import { Result } from '../../../services/types/result.type';
import { IMemoryEngine } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

export class MomentTriggeredHandler extends BaseEventHandler<any> {
  constructor(private memoryEngine: IMemoryEngine) {
    super('MOMENT_TRIGGERED', 6, true);
  }

  protected async onEvent(envelope: EventEnvelope<any>): Promise<void> {
    const { userId, companionId, momentType, description, significance } =
      envelope.payload;

    if (!userId || !companionId || !momentType) {
      return;
    }

    const fullDescription = `${momentType} moment: ${description}. Significance: ${significance}`;

    const createResult = this.memoryEngine.create(
      userId,
      MemoryType.EVENT,
      `Significant moment with ${companionId}`,
      fullDescription
    );

    if (!createResult.isSuccess) {
      console.error('Failed to create moment memory', createResult.error);
    }
  }
}
