import { IResult } from '@services/types/result.type';
import { RelationshipSnapshot, RelationshipEvent } from '../dtos/relationship.dtos';

export interface IRelationshipUpdater {
  /**
   * Apply an event to a snapshot and update dimensions.
   */
  applyEvent(snapshot: RelationshipSnapshot, event: RelationshipEvent): Promise<IResult<RelationshipSnapshot>>;

  /**
   * Decay dimensions due to inactivity.
   */
  applyDecay(snapshot: RelationshipSnapshot, daysSinceLastEvent: number): Promise<IResult<RelationshipSnapshot>>;
}
