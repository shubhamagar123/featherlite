/**
 * RelationshipEvaluator — determines interaction quality and dimension impact.
 *
 * Responsibilities:
 * - Evaluate interaction quality deterministically
 * - Determine affected dimensions from interaction context
 * - Calculate impact maps based on quality and event type
 * - Score growth factors from relationship history
 * - Generate new relationship events
 */

import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { v4 as uuid } from 'uuid';

import {
  InteractionEvaluationInput,
  InteractionEvaluationResult,
  GrowthFactorScore,
  RelationshipEvent,
} from '../dtos/relationship.dtos';
import { IRelationshipEvaluator } from '../interfaces/relationship-evaluator.interface';
import { RelationshipDimensionType, RelationshipEventType, InteractionQuality } from '../enums/relationship.enums';
import { RelationshipRules } from '../rules/relationship.rules';
import type { InteractionContextDTO } from '@engines/context';

export class RelationshipEvaluator implements IRelationshipEvaluator {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger('RelationshipEvaluator');
  }

  async evaluateInteraction(
    input: InteractionEvaluationInput
  ): Promise<IResult<InteractionEvaluationResult>> {
    return Result.tryAsync(async () => {
      const affectedDimensions = this.determineAffectedDimensions(input.eventType, input.quality);

      const estimatedImpact: Partial<Record<RelationshipDimensionType, number>> = {};

      for (const dimension of affectedDimensions) {
        const impact = RelationshipRules.calculateDimensionImpact(
          dimension,
          input.eventType,
          input.quality
        );
        estimatedImpact[dimension] = impact;
      }

      const newEvent: RelationshipEvent = {
        id: uuid(),
        type: input.eventType,
        timestamp: new Date(),
        quality: input.quality,
        description: this.generateEventDescription(input.eventType, input.quality),
        affectedDimensions,
        impact: estimatedImpact as Record<RelationshipDimensionType, number>,
        metadata: input.metadata,
      };

      this.logger.debug(
        {
          eventType: input.eventType,
          quality: input.quality,
          affectedDimensions: affectedDimensions.length,
        },
        'Evaluated interaction'
      );

      return {
        quality: input.quality,
        affectedDimensions,
        estimatedImpact: estimatedImpact as Record<RelationshipDimensionType, number>,
        newEvent,
      };
    });
  }

  async scoreGrowthFactors(
    userId: string,
    companionId: string,
    conversationContext: InteractionContextDTO
  ): Promise<IResult<GrowthFactorScore>> {
    return Result.tryAsync(async () => {
      const memoryCount = conversationContext.memories?.count || 0;
      const momentCount = conversationContext.moments?.count || 0;
      const relationshipLevel = conversationContext.relationship?.level || 'INITIAL_ATTRACTION';

      return {
        conversationQuality: this.scoreConversationQuality(conversationContext),
        conversationFrequency: this.scoreConversationFrequency(userId, companionId),
        meaningfulEvents: Math.min(10, momentCount),
        sharedMemories: Math.min(10, Math.ceil(memoryCount / 2)),
        timeConsistency: this.scoreTimeConsistency(relationshipLevel),
        positiveInteractions: this.scorePositiveInteractions(conversationContext),
        conflictRepairs: this.scoreConflictRepairs(userId, companionId),
        overallConsistency: this.scoreOverallConsistency(userId, companionId),
      };
    });
  }

  private determineAffectedDimensions(
    eventType: RelationshipEventType,
    quality: InteractionQuality
  ): RelationshipDimensionType[] {
    const allDimensions = Object.values(RelationshipDimensionType);
    const affected: RelationshipDimensionType[] = [];

    for (const dimension of allDimensions) {
      const rule = RelationshipRules.getRule(dimension);
      const impact = rule.eventImpacts[eventType];

      if (impact !== undefined && impact !== 0) {
        affected.push(dimension);
      }
    }

    const qualityWeight = this.getQualityWeight(quality);
    if (qualityWeight > 1.2) {
      for (const dimension of [
        RelationshipDimensionType.EMOTIONAL_DEPTH,
        RelationshipDimensionType.TRUST,
      ]) {
        if (!affected.includes(dimension)) {
          affected.push(dimension);
        }
      }
    }

    return affected;
  }

  private getQualityWeight(quality: InteractionQuality): number {
    const weights: Record<InteractionQuality, number> = {
      [InteractionQuality.SUPERFICIAL]: 0.5,
      [InteractionQuality.CASUAL]: 0.8,
      [InteractionQuality.ENGAGED]: 1.0,
      [InteractionQuality.MEANINGFUL]: 1.5,
      [InteractionQuality.PROFOUND]: 2.0,
    };
    return weights[quality];
  }

  private generateEventDescription(eventType: RelationshipEventType, quality: InteractionQuality): string {
    const qualityLabel = quality.toLowerCase().replace(/_/g, ' ');
    const eventLabel = eventType.toLowerCase().replace(/_/g, ' ');
    return `${qualityLabel} ${eventLabel}`;
  }

  private scoreConversationQuality(_context: InteractionContextDTO): number {
    return 7;
  }

  private scoreConversationFrequency(_userId: string, _companionId: string): number {
    return 6;
  }

  private scoreTimeConsistency(relationshipLevel: string): number {
    const levelMap: Record<string, number> = {
      INITIAL_ATTRACTION: 3,
      EXPLORATION: 4,
      DEEPENING: 6,
      STABILIZATION: 8,
      RESILIENCE: 9,
    };
    return levelMap[relationshipLevel] || 5;
  }

  private scorePositiveInteractions(_context: InteractionContextDTO): number {
    return 7;
  }

  private scoreConflictRepairs(_userId: string, _companionId: string): number {
    return 5;
  }

  private scoreOverallConsistency(_userId: string, _companionId: string): number {
    return 6;
  }
}
