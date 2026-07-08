import { IResult } from '@services/types/result.type';
import { RelationshipSnapshot, EvolutionStrategy } from '../dtos/relationship.dtos';
import { GrowthStrategyType } from '../enums/relationship.enums';

export interface IRelationshipEvolutionStrategy {
  /**
   * Execute a growth strategy to evolve the relationship.
   */
  execute(snapshot: RelationshipSnapshot): Promise<IResult<RelationshipSnapshot>>;

  /**
   * Determine which strategy should be applied based on current state.
   */
  recommendStrategy(snapshot: RelationshipSnapshot): IResult<EvolutionStrategy>;
}
