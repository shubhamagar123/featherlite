import { BaseDomainEvent } from '../contracts/base-domain-event';
import { EventType, AggregateType, EventPriority } from '../enums/event.enums';
import { EventContext } from '../dto/event.dto';

export interface RelationshipDimensionChangedPayload {
  userId: string;
  companionId: string;
  dimension: string;
  oldValue: number;
  newValue: number;
  change: number;
  reason: string;
}

export class RelationshipDimensionChangedEvent extends BaseDomainEvent<RelationshipDimensionChangedPayload> {
  constructor(
    relationshipId: string,
    payload: RelationshipDimensionChangedPayload,
    context: EventContext
  ) {
    super(
      relationshipId,
      AggregateType.RELATIONSHIP,
      EventType.RELATIONSHIP_DIMENSION_CHANGED,
      'Relationship Dimension Changed',
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
      payload.dimension &&
      typeof payload.oldValue === 'number' &&
      typeof payload.newValue === 'number'
    );
  }

  getDimension(): string {
    return this.getPayload().dimension;
  }

  getOldValue(): number {
    return this.getPayload().oldValue;
  }

  getNewValue(): number {
    return this.getPayload().newValue;
  }

  getChange(): number {
    return this.getPayload().change;
  }

  getReason(): string {
    return this.getPayload().reason;
  }
}
