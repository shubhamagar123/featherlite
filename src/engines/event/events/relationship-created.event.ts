import { BaseDomainEvent } from '../contracts/base-domain-event';
import { EventType, AggregateType, EventPriority } from '../enums/event.enums';
import { EventContext } from '../dto/event.dto';

export interface RelationshipCreatedPayload {
  userId: string;
  companionId: string;
  status: string;
  phase: string;
}

export class RelationshipCreatedEvent extends BaseDomainEvent<RelationshipCreatedPayload> {
  constructor(
    relationshipId: string,
    payload: RelationshipCreatedPayload,
    context: EventContext
  ) {
    super(
      relationshipId,
      AggregateType.RELATIONSHIP,
      EventType.RELATIONSHIP_UPDATED,
      'Relationship Created',
      payload,
      context,
      EventPriority.HIGH,
      1
    );
  }

  validate(): boolean {
    const payload = this.getPayload();
    return Boolean(payload.userId && payload.companionId && payload.status);
  }

  getStatus(): string {
    return this.getPayload().status;
  }

  getPhase(): string {
    return this.getPayload().phase;
  }
}
