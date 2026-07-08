/**
 * RelationshipContext — provides calculation context and growth rules for dimension evolution.
 *
 * Responsibilities:
 * - Provide calculation context for relationship calculations
 * - Access centralized growth rules
 * - Track time and event history for calculations
 */

import { RelationshipCalculationContext, DimensionGrowthRule } from '../dtos/relationship.dtos';
import { RelationshipDimensionType } from '../enums/relationship.enums';
import { IRelationshipContext } from '../interfaces/relationship-context.interface';
import { RelationshipRules } from '../rules/relationship.rules';

export class RelationshipContext implements IRelationshipContext {
  async getCalculationContext(
    userId: string,
    companionId: string,
    currentDate: Date
  ): Promise<RelationshipCalculationContext> {
    return {
      userId,
      companionId,
      currentDate,
      recentEvents: [],
      timeElapsedDays: 0,
    };
  }

  getGrowthRules(): DimensionGrowthRule[] {
    const allRules = RelationshipRules.getAllRules();
    return Object.values(allRules);
  }

  getGrowthRule(dimension: RelationshipDimensionType): DimensionGrowthRule {
    return RelationshipRules.getRule(dimension);
  }
}
