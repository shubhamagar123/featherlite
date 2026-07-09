import { BaseDomainEvent } from '../contracts/base-domain-event';
import { EventType, AggregateType, EventPriority } from '../enums/event.enums';
import { EventContext } from '../dto/event.dto';

export interface DimensionChange {
  dimension: string;
  oldValue: number;
  newValue: number;
  change: number;
  reason: string;
}

export interface RelationshipDimensionsBatchChangedPayload {
  userId: string;
  companionId: string;
  changes: DimensionChange[];
}

/**
 * Batch event for multiple relationship dimension changes.
 * Consolidates up to 12 individual dimension changes into a single event,
 * reducing handler overhead and improving throughput for bulk updates.
 */
export class RelationshipDimensionsBatchChangedEvent extends BaseDomainEvent<RelationshipDimensionsBatchChangedPayload> {
  constructor(
    relationshipId: string,
    payload: RelationshipDimensionsBatchChangedPayload,
    context: EventContext
  ) {
    super(
      relationshipId,
      AggregateType.RELATIONSHIP,
      EventType.RELATIONSHIP_DIMENSIONS_BATCH_CHANGED,
      'Relationship Dimensions Batch Changed',
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
      Array.isArray(payload.changes) &&
      payload.changes.length > 0 &&
      payload.changes.every(
        c =>
          c.dimension &&
          typeof c.oldValue === 'number' &&
          typeof c.newValue === 'number' &&
          typeof c.change === 'number'
      )
    );
  }

  getChanges(): DimensionChange[] {
    return this.getPayload().changes;
  }

  getChangeCount(): number {
    return this.getPayload().changes.length;
  }

  getChangeForDimension(dimension: string): DimensionChange | undefined {
    return this.getPayload().changes.find(c => c.dimension === dimension);
  }
}
