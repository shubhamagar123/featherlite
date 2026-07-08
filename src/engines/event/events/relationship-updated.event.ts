import { BaseDomainEvent } from '../contracts/base-domain-event';
import { EventType, AggregateType, EventPriority } from '../enums/event.enums';
import { EventContext } from '../dto/event.dto';

export interface RelationshipUpdatedPayload {
  userId: string;
  companionId: string;
  status: string;
  phase: string;
  overallHealth: number;
  trajectory: number;
}

export class RelationshipUpdatedEvent extends BaseDomainEvent<RelationshipUpdatedPayload> {
  constructor(
    relationshipId: string,
    payload: RelationshipUpdatedPayload,
    context: EventContext
  ) {
    super(
      relationshipId,
      AggregateType.RELATIONSHIP,
      EventType.RELATIONSHIP_UPDATED,
      'Relationship Updated',
      payload,
      context,
      EventPriority.NORMAL,
      1
    );
  }

  validate(): boolean {
    const payload = this.getPayload();
    return Boolean(
      payload.userId &&
      payload.companionId &&
      payload.status &&
      typeof payload.overallHealth === 'number'
    );
  }

  getStatus(): string {
    return this.getPayload().status;
  }

  getPhase(): string {
    return this.getPayload().phase;
  }

  getOverallHealth(): number {
    return this.getPayload().overallHealth;
  }

  getTrajectory(): number {
    return this.getPayload().trajectory;
  }
}
