import { BaseDomainEvent } from '@engines/event';
import { EventType, AggregateType, EventPriority } from '@engines/event';
import type { EventContext } from '@engines/event';
import { MomentKind, MomentSignificance } from '../enums/moment.enums';

export interface MomentTriggeredPayload {
  momentId: string;
  userId: string;
  companionId: string;
  kind: MomentKind;
  significance: MomentSignificance;
  title: string;
  description?: string;
  scheduledFor: Date;
  data?: Record<string, unknown>;
}

export class MomentTriggeredEvent extends BaseDomainEvent<MomentTriggeredPayload> {
  constructor(momentId: string, payload: MomentTriggeredPayload, context: EventContext) {
    super(
      momentId,
      AggregateType.MOMENT,
      EventType.MOMENT_TRIGGERED,
      'Moment Triggered',
      payload,
      context,
      EventPriority.NORMAL,
      1
    );
  }

  validate(): boolean {
    const p = this.getPayload();
    return Boolean(p.momentId && p.userId && p.companionId && p.title);
  }
}
