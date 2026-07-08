/**
 * RelationshipRules — growth rules for each of the 12 relationship dimensions.
 *
 * Each dimension has:
 * - Base growth rate (per day of consistency)
 * - Event impact multipliers (varies by event type)
 * - Quality multipliers (superficial vs profound)
 * - Decay rate (when inactive)
 * - Min/max bounds (0-100)
 */

import {
  RelationshipDimensionType,
  RelationshipEventType,
  InteractionQuality,
} from '../enums/relationship.enums';
import { DimensionGrowthRule } from '../dtos/relationship.dtos';

export class RelationshipRules {
  /** Growth rules for each dimension. */
  private static readonly RULES: Record<RelationshipDimensionType, DimensionGrowthRule> = {
    [RelationshipDimensionType.TRUST]: {
      dimension: RelationshipDimensionType.TRUST,
      baseGrowthRate: 0.3, // per day
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 1,
        [RelationshipEventType.SHARED_MOMENT]: 2,
        [RelationshipEventType.MEMORY_CREATED]: 1,
        [RelationshipEventType.MILESTONE_REACHED]: 3,
        [RelationshipEventType.CONFLICT]: -3,
        [RelationshipEventType.REPAIR]: 4,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
        [RelationshipEventType.JOKE_SHARED]: 0,
        [RelationshipEventType.BOUNDARY_SET]: 2,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 2,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.5,
        [InteractionQuality.CASUAL]: 0.75,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.5,
        [InteractionQuality.PROFOUND]: 2.0,
      },
      decayRate: 0.15, // per day when inactive
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.COMFORT]: {
      dimension: RelationshipDimensionType.COMFORT,
      baseGrowthRate: 0.25,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 1,
        [RelationshipEventType.SHARED_MOMENT]: 2,
        [RelationshipEventType.MEMORY_CREATED]: 1,
        [RelationshipEventType.MILESTONE_REACHED]: 2,
        [RelationshipEventType.CONFLICT]: -2,
        [RelationshipEventType.REPAIR]: 2,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 2,
        [RelationshipEventType.JOKE_SHARED]: 1,
        [RelationshipEventType.BOUNDARY_SET]: 1,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 1,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.5,
        [InteractionQuality.CASUAL]: 0.8,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.4,
        [InteractionQuality.PROFOUND]: 1.8,
      },
      decayRate: 0.2,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.PLAYFULNESS]: {
      dimension: RelationshipDimensionType.PLAYFULNESS,
      baseGrowthRate: 0.2,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 0,
        [RelationshipEventType.SHARED_MOMENT]: 1,
        [RelationshipEventType.MEMORY_CREATED]: 0,
        [RelationshipEventType.MILESTONE_REACHED]: 1,
        [RelationshipEventType.CONFLICT]: -2,
        [RelationshipEventType.REPAIR]: 1,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
        [RelationshipEventType.JOKE_SHARED]: 3,
        [RelationshipEventType.BOUNDARY_SET]: -1,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 0,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.3,
        [InteractionQuality.CASUAL]: 0.8,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.2,
        [InteractionQuality.PROFOUND]: 1.3,
      },
      decayRate: 0.25,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.EMOTIONAL_DEPTH]: {
      dimension: RelationshipDimensionType.EMOTIONAL_DEPTH,
      baseGrowthRate: 0.35,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 2,
        [RelationshipEventType.SHARED_MOMENT]: 3,
        [RelationshipEventType.MEMORY_CREATED]: 2,
        [RelationshipEventType.MILESTONE_REACHED]: 3,
        [RelationshipEventType.CONFLICT]: -2,
        [RelationshipEventType.REPAIR]: 3,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
        [RelationshipEventType.JOKE_SHARED]: 0,
        [RelationshipEventType.BOUNDARY_SET]: 2,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 1,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.2,
        [InteractionQuality.CASUAL]: 0.5,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.8,
        [InteractionQuality.PROFOUND]: 2.5,
      },
      decayRate: 0.1,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.COMMUNICATION_STYLE]: {
      dimension: RelationshipDimensionType.COMMUNICATION_STYLE,
      baseGrowthRate: 0.3,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 2,
        [RelationshipEventType.SHARED_MOMENT]: 1,
        [RelationshipEventType.MEMORY_CREATED]: 1,
        [RelationshipEventType.MILESTONE_REACHED]: 1,
        [RelationshipEventType.CONFLICT]: -1,
        [RelationshipEventType.REPAIR]: 2,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 0,
        [RelationshipEventType.JOKE_SHARED]: 1,
        [RelationshipEventType.BOUNDARY_SET]: 1,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 1,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.3,
        [InteractionQuality.CASUAL]: 0.7,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.5,
        [InteractionQuality.PROFOUND]: 2.0,
      },
      decayRate: 0.12,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.SHARED_RITUALS]: {
      dimension: RelationshipDimensionType.SHARED_RITUALS,
      baseGrowthRate: 0.2,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 0,
        [RelationshipEventType.SHARED_MOMENT]: 1,
        [RelationshipEventType.MEMORY_CREATED]: 1,
        [RelationshipEventType.MILESTONE_REACHED]: 2,
        [RelationshipEventType.CONFLICT]: -2,
        [RelationshipEventType.REPAIR]: 1,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 5,
        [RelationshipEventType.JOKE_SHARED]: 0,
        [RelationshipEventType.BOUNDARY_SET]: 0,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 2,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.5,
        [InteractionQuality.CASUAL]: 0.8,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.3,
        [InteractionQuality.PROFOUND]: 1.5,
      },
      decayRate: 0.3,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.SHARED_MEMORIES]: {
      dimension: RelationshipDimensionType.SHARED_MEMORIES,
      baseGrowthRate: 0.25,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 0,
        [RelationshipEventType.SHARED_MOMENT]: 3,
        [RelationshipEventType.MEMORY_CREATED]: 5,
        [RelationshipEventType.MILESTONE_REACHED]: 3,
        [RelationshipEventType.CONFLICT]: -1,
        [RelationshipEventType.REPAIR]: 2,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
        [RelationshipEventType.JOKE_SHARED]: 1,
        [RelationshipEventType.BOUNDARY_SET]: 1,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 1,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.3,
        [InteractionQuality.CASUAL]: 0.6,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.6,
        [InteractionQuality.PROFOUND]: 2.2,
      },
      decayRate: 0.05,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.BOUNDARIES]: {
      dimension: RelationshipDimensionType.BOUNDARIES,
      baseGrowthRate: 0.15,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 0,
        [RelationshipEventType.SHARED_MOMENT]: 0,
        [RelationshipEventType.MEMORY_CREATED]: 0,
        [RelationshipEventType.MILESTONE_REACHED]: 0,
        [RelationshipEventType.CONFLICT]: 1,
        [RelationshipEventType.REPAIR]: 2,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 0,
        [RelationshipEventType.JOKE_SHARED]: 0,
        [RelationshipEventType.BOUNDARY_SET]: 4,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 1,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.5,
        [InteractionQuality.CASUAL]: 0.7,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.4,
        [InteractionQuality.PROFOUND]: 1.8,
      },
      decayRate: 0.08,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.FAMILIARITY]: {
      dimension: RelationshipDimensionType.FAMILIARITY,
      baseGrowthRate: 0.4,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 1,
        [RelationshipEventType.SHARED_MOMENT]: 2,
        [RelationshipEventType.MEMORY_CREATED]: 1,
        [RelationshipEventType.MILESTONE_REACHED]: 2,
        [RelationshipEventType.CONFLICT]: 0,
        [RelationshipEventType.REPAIR]: 1,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
        [RelationshipEventType.JOKE_SHARED]: 1,
        [RelationshipEventType.BOUNDARY_SET]: 1,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 3,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.4,
        [InteractionQuality.CASUAL]: 0.8,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.3,
        [InteractionQuality.PROFOUND]: 1.5,
      },
      decayRate: 0.05,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.RELIABILITY]: {
      dimension: RelationshipDimensionType.RELIABILITY,
      baseGrowthRate: 0.25,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 1,
        [RelationshipEventType.SHARED_MOMENT]: 1,
        [RelationshipEventType.MEMORY_CREATED]: 0,
        [RelationshipEventType.MILESTONE_REACHED]: 1,
        [RelationshipEventType.CONFLICT]: -2,
        [RelationshipEventType.REPAIR]: 2,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
        [RelationshipEventType.JOKE_SHARED]: 0,
        [RelationshipEventType.BOUNDARY_SET]: 1,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 4,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.5,
        [InteractionQuality.CASUAL]: 0.8,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.3,
        [InteractionQuality.PROFOUND]: 1.6,
      },
      decayRate: 0.2,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.SUPPORTIVENESS]: {
      dimension: RelationshipDimensionType.SUPPORTIVENESS,
      baseGrowthRate: 0.3,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 1,
        [RelationshipEventType.SHARED_MOMENT]: 2,
        [RelationshipEventType.MEMORY_CREATED]: 1,
        [RelationshipEventType.MILESTONE_REACHED]: 3,
        [RelationshipEventType.CONFLICT]: -2,
        [RelationshipEventType.REPAIR]: 3,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
        [RelationshipEventType.JOKE_SHARED]: 0,
        [RelationshipEventType.BOUNDARY_SET]: 1,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 2,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.3,
        [InteractionQuality.CASUAL]: 0.6,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.7,
        [InteractionQuality.PROFOUND]: 2.3,
      },
      decayRate: 0.15,
      maxValue: 100,
      minValue: 0,
    },

    [RelationshipDimensionType.RESPECT]: {
      dimension: RelationshipDimensionType.RESPECT,
      baseGrowthRate: 0.2,
      eventImpacts: {
        [RelationshipEventType.CONVERSATION]: 1,
        [RelationshipEventType.SHARED_MOMENT]: 1,
        [RelationshipEventType.MEMORY_CREATED]: 0,
        [RelationshipEventType.MILESTONE_REACHED]: 2,
        [RelationshipEventType.CONFLICT]: -3,
        [RelationshipEventType.REPAIR]: 2,
        [RelationshipEventType.RITUAL_ESTABLISHED]: 1,
        [RelationshipEventType.JOKE_SHARED]: 0,
        [RelationshipEventType.BOUNDARY_SET]: 2,
        [RelationshipEventType.CONSISTENCY_MAINTAINED]: 2,
      },
      qualityMultipliers: {
        [InteractionQuality.SUPERFICIAL]: 0.4,
        [InteractionQuality.CASUAL]: 0.7,
        [InteractionQuality.ENGAGED]: 1.0,
        [InteractionQuality.MEANINGFUL]: 1.5,
        [InteractionQuality.PROFOUND]: 2.0,
      },
      decayRate: 0.1,
      maxValue: 100,
      minValue: 0,
    },
  };

  /** Get the growth rule for a dimension. */
  static getRule(dimension: RelationshipDimensionType): DimensionGrowthRule {
    return this.RULES[dimension];
  }

  /** Get all growth rules. */
  static getAllRules(): Record<RelationshipDimensionType, DimensionGrowthRule> {
    return this.RULES;
  }

  /** Calculate impact for a specific dimension, event, and quality. */
  static calculateDimensionImpact(
    dimension: RelationshipDimensionType,
    eventType: RelationshipEventType,
    quality: InteractionQuality
  ): number {
    const rule = this.getRule(dimension);
    const baseImpact = rule.eventImpacts[eventType] || 0;
    const qualityMultiplier = rule.qualityMultipliers[quality];
    return Math.round(baseImpact * qualityMultiplier * 10) / 10;
  }

  /** Apply daily decay to a dimension value. */
  static applyDecay(dimension: RelationshipDimensionType, currentValue: number): number {
    const rule = this.getRule(dimension);
    const decayAmount = currentValue * rule.decayRate;
    const newValue = Math.max(rule.minValue, currentValue - decayAmount);
    return Math.round(newValue * 10) / 10;
  }

  /** Apply daily base growth to a dimension value. */
  static applyBaseGrowth(dimension: RelationshipDimensionType, currentValue: number): number {
    const rule = this.getRule(dimension);
    const growthAmount = rule.baseGrowthRate;
    const newValue = Math.min(rule.maxValue, currentValue + growthAmount);
    return Math.round(newValue * 10) / 10;
  }

  /** Apply impact to a dimension value. */
  static applyImpact(
    dimension: RelationshipDimensionType,
    currentValue: number,
    impact: number
  ): number {
    const rule = this.getRule(dimension);
    const newValue = currentValue + impact;
    return Math.max(rule.minValue, Math.min(rule.maxValue, newValue));
  }

  /** Determine if a value change is significant. */
  static isSignificantChange(oldValue: number, newValue: number): boolean {
    return Math.abs(newValue - oldValue) >= 5;
  }

  /** Calculate trend based on recent changes. */
  static calculateTrend(
    valueHistory: Array<{ value: number; timestamp: Date }>,
    windowDays: number = 7
  ): number {
    if (valueHistory.length < 2) return 0;

    const now = new Date();
    const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const recentHistory = valueHistory.filter(h => h.timestamp >= cutoff);

    if (recentHistory.length < 2) return 0;

    const oldest = recentHistory[0].value;
    const newest = recentHistory[recentHistory.length - 1].value;
    const change = newest - oldest;

    if (change > 10) return 2;
    if (change > 5) return 1;
    if (change < -10) return -2;
    if (change < -5) return -1;
    return 0;
  }
}
