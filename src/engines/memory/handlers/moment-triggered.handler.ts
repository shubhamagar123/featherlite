import { BaseEventHandler } from '@engines/event';
import type { EventEnvelope } from '@engines/event';
import { EventType } from '@engines/event';
import { IMemoryOperations } from '../interfaces/memory.interfaces';
import { MemoryType } from '../enums/memory.enums';

interface MomentTriggeredPayload {
  userId?: string;
  companionId?: string;
  momentType?: string;
  description?: string;
  significance?: number | string;
}

export class MomentTriggeredHandler extends BaseEventHandler<MomentTriggeredPayload> {
  constructor(private readonly memoryEngine: IMemoryOperations) {
    super(EventType.MOMENT_TRIGGERED, 6, true);
  }

  protected async onEvent(envelope: EventEnvelope<MomentTriggeredPayload>): Promise<void> {
    const { userId, companionId, momentType, description, significance } = envelope.payload;

    if (!userId || !companionId || !momentType) return;

    const fullDescription = `${momentType} moment: ${description}. Significance: ${significance}`;

    const createResult = this.memoryEngine.create(
      userId,
      MemoryType.EVENT,
      `Significant moment with ${companionId}`,
      fullDescription
    );

    if (!createResult.isSuccess) {
      this.logger.warn(
        { err: createResult.error, eventId: envelope.metadata.eventId, userId, companionId },
        'Failed to create moment memory'
      );
    }
  }
}
