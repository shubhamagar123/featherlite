import { RelationshipCalculationContext, DimensionGrowthRule } from '../dtos/relationship.dtos';
import { RelationshipDimensionType } from '../enums/relationship.enums';

export interface IRelationshipContext {
  /**
   * Get context for relationship calculations.
   */
  getCalculationContext(
    userId: string,
    companionId: string,
    currentDate: Date
  ): Promise<RelationshipCalculationContext>;

  /**
   * Get growth rules for all dimensions.
   */
  getGrowthRules(): DimensionGrowthRule[];

  /**
   * Get growth rule for a specific dimension.
   */
  getGrowthRule(dimension: RelationshipDimensionType): DimensionGrowthRule;
}
