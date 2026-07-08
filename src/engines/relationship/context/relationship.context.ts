/**
 * RelationshipContext — provides calculation context and growth rules for dimension evolution.
 *
 * Responsibilities:
 * - Provide calculation context for relationship calculations
 * - Define growth rules for all 15 dimensions
 * - Return dimension-specific rules on demand
 */

import { RelationshipCalculationContext, DimensionGrowthRule } from '../dtos/relationship.dtos';
import { RelationshipDimensionType, RelationshipEventType, InteractionQuality } from '../enums/relationship.enums';
import { IRelationshipContext } from '../interfaces/relationship-context.interface';

export class RelationshipContext implements IRelationshipContext {
  private growthRules: DimensionGrowthRule[];

  constructor() {
    this.growthRules = this.initializeGrowthRules();
  }

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
    return this.growthRules;
  }

  getGrowthRule(dimension: RelationshipDimensionType): DimensionGrowthRule {
    const rule = this.growthRules.find((r) => r.dimension === dimension);
    if (!rule) {
      throw new Error(`No growth rule found for dimension: ${dimension}`);
    }
    return rule;
  }

  private initializeGrowthRules(): DimensionGrowthRule[] {
    return [
      {
        dimension: RelationshipDimensionType.TRUST,
        baseGrowthRate: 0.5,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 2,
          [RelationshipEventType.SHARED_MOMENT]: 3,
          [RelationshipEventType.MEMORY_CREATED]: 2,
          [RelationshipEventType.MILESTONE_REACHED]: 4,
          [RelationshipEventType.CONFLICT]: -5,
          [RelationshipEventType.REPAIR]: 6,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 2,
          [RelationshipEventType.JOKE_SHARED]: 1,
          [RelationshipEventType.BOUNDARY_SET]: 3,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 2,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.3,
          [InteractionQuality.CASUAL]: 0.6,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.5,
          [InteractionQuality.PROFOUND]: 2.0,
        },
        decayRate: 0.1,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.COMFORT,
        baseGrowthRate: 0.4,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 1,
          [RelationshipEventType.SHARED_MOMENT]: 3,
          [RelationshipEventType.MEMORY_CREATED]: 2,
          [RelationshipEventType.MILESTONE_REACHED]: 2,
          [RelationshipEventType.CONFLICT]: -4,
          [RelationshipEventType.REPAIR]: 3,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 4,
          [RelationshipEventType.JOKE_SHARED]: 2,
          [RelationshipEventType.BOUNDARY_SET]: -2,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 3,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.2,
          [InteractionQuality.CASUAL]: 0.7,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.3,
          [InteractionQuality.PROFOUND]: 1.5,
        },
        decayRate: 0.15,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.PLAYFULNESS,
        baseGrowthRate: 0.3,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 1,
          [RelationshipEventType.SHARED_MOMENT]: 2,
          [RelationshipEventType.MEMORY_CREATED]: 1,
          [RelationshipEventType.MILESTONE_REACHED]: 1,
          [RelationshipEventType.CONFLICT]: -3,
          [RelationshipEventType.REPAIR]: 1,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
          [RelationshipEventType.JOKE_SHARED]: 5,
          [RelationshipEventType.BOUNDARY_SET]: -1,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 1,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.1,
          [InteractionQuality.CASUAL]: 0.8,
          [InteractionQuality.ENGAGED]: 0.9,
          [InteractionQuality.MEANINGFUL]: 0.7,
          [InteractionQuality.PROFOUND]: 0.5,
        },
        decayRate: 0.2,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.EMOTIONAL_DEPTH,
        baseGrowthRate: 0.5,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 2,
          [RelationshipEventType.SHARED_MOMENT]: 4,
          [RelationshipEventType.MEMORY_CREATED]: 3,
          [RelationshipEventType.MILESTONE_REACHED]: 3,
          [RelationshipEventType.CONFLICT]: -2,
          [RelationshipEventType.REPAIR]: 5,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 2,
          [RelationshipEventType.JOKE_SHARED]: 1,
          [RelationshipEventType.BOUNDARY_SET]: 2,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 2,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.2,
          [InteractionQuality.CASUAL]: 0.5,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.8,
          [InteractionQuality.PROFOUND]: 2.5,
        },
        decayRate: 0.08,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.COMMUNICATION_STYLE,
        baseGrowthRate: 0.4,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 3,
          [RelationshipEventType.SHARED_MOMENT]: 1,
          [RelationshipEventType.MEMORY_CREATED]: 1,
          [RelationshipEventType.MILESTONE_REACHED]: 1,
          [RelationshipEventType.CONFLICT]: -3,
          [RelationshipEventType.REPAIR]: 4,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 2,
          [RelationshipEventType.JOKE_SHARED]: 2,
          [RelationshipEventType.BOUNDARY_SET]: 2,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 2,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.3,
          [InteractionQuality.CASUAL]: 0.7,
          [InteractionQuality.ENGAGED]: 1.2,
          [InteractionQuality.MEANINGFUL]: 1.5,
          [InteractionQuality.PROFOUND]: 1.8,
        },
        decayRate: 0.1,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.SHARED_RITUALS,
        baseGrowthRate: 0.2,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 1,
          [RelationshipEventType.SHARED_MOMENT]: 2,
          [RelationshipEventType.MEMORY_CREATED]: 1,
          [RelationshipEventType.MILESTONE_REACHED]: 2,
          [RelationshipEventType.CONFLICT]: -2,
          [RelationshipEventType.REPAIR]: 1,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 8,
          [RelationshipEventType.JOKE_SHARED]: 1,
          [RelationshipEventType.BOUNDARY_SET]: 1,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 4,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.1,
          [InteractionQuality.CASUAL]: 0.5,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.2,
          [InteractionQuality.PROFOUND]: 1.4,
        },
        decayRate: 0.25,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.SHARED_MEMORIES,
        baseGrowthRate: 0.3,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 1,
          [RelationshipEventType.SHARED_MOMENT]: 3,
          [RelationshipEventType.MEMORY_CREATED]: 7,
          [RelationshipEventType.MILESTONE_REACHED]: 3,
          [RelationshipEventType.CONFLICT]: -1,
          [RelationshipEventType.REPAIR]: 2,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 2,
          [RelationshipEventType.JOKE_SHARED]: 2,
          [RelationshipEventType.BOUNDARY_SET]: 1,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 1,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.2,
          [InteractionQuality.CASUAL]: 0.6,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.4,
          [InteractionQuality.PROFOUND]: 1.8,
        },
        decayRate: 0.05,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.BOUNDARIES,
        baseGrowthRate: 0.3,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 0,
          [RelationshipEventType.SHARED_MOMENT]: 0,
          [RelationshipEventType.MEMORY_CREATED]: 0,
          [RelationshipEventType.MILESTONE_REACHED]: 1,
          [RelationshipEventType.CONFLICT]: -4,
          [RelationshipEventType.REPAIR]: 3,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
          [RelationshipEventType.JOKE_SHARED]: 0,
          [RelationshipEventType.BOUNDARY_SET]: 6,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 2,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.5,
          [InteractionQuality.CASUAL]: 0.8,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.0,
          [InteractionQuality.PROFOUND]: 0.9,
        },
        decayRate: 0.1,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.FAMILIARITY,
        baseGrowthRate: 0.4,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 2,
          [RelationshipEventType.SHARED_MOMENT]: 2,
          [RelationshipEventType.MEMORY_CREATED]: 2,
          [RelationshipEventType.MILESTONE_REACHED]: 1,
          [RelationshipEventType.CONFLICT]: -1,
          [RelationshipEventType.REPAIR]: 1,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 3,
          [RelationshipEventType.JOKE_SHARED]: 1,
          [RelationshipEventType.BOUNDARY_SET]: 1,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 3,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.3,
          [InteractionQuality.CASUAL]: 0.8,
          [InteractionQuality.ENGAGED]: 1.1,
          [InteractionQuality.MEANINGFUL]: 1.2,
          [InteractionQuality.PROFOUND]: 1.3,
        },
        decayRate: 0.12,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.RELIABILITY,
        baseGrowthRate: 0.4,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 1,
          [RelationshipEventType.SHARED_MOMENT]: 1,
          [RelationshipEventType.MEMORY_CREATED]: 1,
          [RelationshipEventType.MILESTONE_REACHED]: 2,
          [RelationshipEventType.CONFLICT]: -4,
          [RelationshipEventType.REPAIR]: 5,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 2,
          [RelationshipEventType.JOKE_SHARED]: 0,
          [RelationshipEventType.BOUNDARY_SET]: 1,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 5,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.4,
          [InteractionQuality.CASUAL]: 0.7,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.2,
          [InteractionQuality.PROFOUND]: 1.3,
        },
        decayRate: 0.08,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.INSIDE_JOKES,
        baseGrowthRate: 0.2,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 1,
          [RelationshipEventType.SHARED_MOMENT]: 2,
          [RelationshipEventType.MEMORY_CREATED]: 1,
          [RelationshipEventType.MILESTONE_REACHED]: 1,
          [RelationshipEventType.CONFLICT]: -2,
          [RelationshipEventType.REPAIR]: 1,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
          [RelationshipEventType.JOKE_SHARED]: 6,
          [RelationshipEventType.BOUNDARY_SET]: 0,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 1,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.0,
          [InteractionQuality.CASUAL]: 0.6,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.2,
          [InteractionQuality.PROFOUND]: 1.4,
        },
        decayRate: 0.3,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.SUPPORTIVENESS,
        baseGrowthRate: 0.4,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 2,
          [RelationshipEventType.SHARED_MOMENT]: 3,
          [RelationshipEventType.MEMORY_CREATED]: 1,
          [RelationshipEventType.MILESTONE_REACHED]: 3,
          [RelationshipEventType.CONFLICT]: -2,
          [RelationshipEventType.REPAIR]: 4,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
          [RelationshipEventType.JOKE_SHARED]: 1,
          [RelationshipEventType.BOUNDARY_SET]: 1,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 2,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.2,
          [InteractionQuality.CASUAL]: 0.6,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.5,
          [InteractionQuality.PROFOUND]: 2.0,
        },
        decayRate: 0.09,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.RESPECT,
        baseGrowthRate: 0.4,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 1,
          [RelationshipEventType.SHARED_MOMENT]: 1,
          [RelationshipEventType.MEMORY_CREATED]: 1,
          [RelationshipEventType.MILESTONE_REACHED]: 2,
          [RelationshipEventType.CONFLICT]: -3,
          [RelationshipEventType.REPAIR]: 4,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
          [RelationshipEventType.JOKE_SHARED]: 1,
          [RelationshipEventType.BOUNDARY_SET]: 3,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 3,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.3,
          [InteractionQuality.CASUAL]: 0.7,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.3,
          [InteractionQuality.PROFOUND]: 1.6,
        },
        decayRate: 0.1,
        maxValue: 100,
        minValue: 0,
      },
      {
        dimension: RelationshipDimensionType.OPENNESS,
        baseGrowthRate: 0.3,
        eventImpacts: {
          [RelationshipEventType.CONVERSATION]: 2,
          [RelationshipEventType.SHARED_MOMENT]: 2,
          [RelationshipEventType.MEMORY_CREATED]: 2,
          [RelationshipEventType.MILESTONE_REACHED]: 2,
          [RelationshipEventType.CONFLICT]: -2,
          [RelationshipEventType.REPAIR]: 3,
          [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
          [RelationshipEventType.JOKE_SHARED]: 1,
          [RelationshipEventType.BOUNDARY_SET]: 0,
          [RelationshipEventType.CONSISTENCY_MAINTAINED]: 1,
        },
        qualityMultipliers: {
          [InteractionQuality.SUPERFICIAL]: 0.2,
          [InteractionQuality.CASUAL]: 0.6,
          [InteractionQuality.ENGAGED]: 1.0,
          [InteractionQuality.MEANINGFUL]: 1.5,
          [InteractionQuality.PROFOUND]: 2.0,
        },
        decayRate: 0.12,
        maxValue: 100,
        minValue: 0,
      },
    ];
  }
}
