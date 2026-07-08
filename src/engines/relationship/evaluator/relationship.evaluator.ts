/**
 * RelationshipEvaluator — determines interaction quality and dimension impact.
 *
 * Responsibilities:
 * - Evaluate interaction quality deterministically
 * - Calculate affected dimensions from interaction
 * - Score growth factors independently
 * - Generate impact maps for events
 */

import { IResult, Result } from '@services/types/result.type';
import {
  InteractionEvaluationInput,
  InteractionEvaluationResult,
  GrowthFactorScore,
  RelationshipEvent,
} from '../dtos/relationship.dtos';
import { IRelationshipEvaluator } from '../interfaces/relationship-evaluator.interface';
import { IRelationshipContext } from '../interfaces/relationship-context.interface';
import { RelationshipDimensionType, InteractionQuality } from '../enums/relationship.enums';
import type { InteractionContextDTO } from '@engines/context';
import { v4 as uuid } from 'uuid';

export class RelationshipEvaluator implements IRelationshipEvaluator {
  constructor(private relationshipContext: IRelationshipContext) {}

  async evaluateInteraction(
    input: InteractionEvaluationInput
  ): Promise<IResult<InteractionEvaluationResult>> {
    return Result.tryAsync(async () => {
      const affectedDimensions = this.determineAffectedDimensions(
        input.eventType,
        input.quality
      );

      const estimatedImpact: Partial<Record<RelationshipDimensionType, number>> = {};

      for (const dimension of affectedDimensions) {
        const rule = this.relationshipContext.getGrowthRule(dimension);
        const baseImpact = rule.eventImpacts[input.eventType] || 0;
        const qualityMultiplier = rule.qualityMultipliers[input.quality];
        estimatedImpact[dimension] = Math.round(baseImpact * qualityMultiplier);
      }

      const newEvent: RelationshipEvent = {
        id: uuid(),
        type: input.eventType,
        timestamp: new Date(),
        quality: input.quality,
        description: `${input.quality} interaction (${input.eventType})`,
        affectedDimensions,
        impact: estimatedImpact as Record<RelationshipDimensionType, number>,
        metadata: input.metadata,
      };

      return {
        quality: input.quality,
        affectedDimensions,
        estimatedImpact: estimatedImpact as Record<RelationshipDimensionType, number>,
        newEvent,
      };
    });
  }

  async scoreGrowthFactors(
    _userId: string,
    _companionId: string,
    _conversationContext: InteractionContextDTO
  ): Promise<IResult<GrowthFactorScore>> {
    return Result.success({
      conversationQuality: 5,
      conversationFrequency: 5,
      meaningfulEvents: 5,
      sharedMemories: 5,
      timeConsistency: 5,
      positiveInteractions: 5,
      conflictRepairs: 5,
      overallConsistency: 5,
    });
  }

  private determineAffectedDimensions(
    eventType: string,
    quality: InteractionQuality
  ): RelationshipDimensionType[] {
    const baseDimensions: RelationshipDimensionType[] = [];

    baseDimensions.push(RelationshipDimensionType.TRUST);
    baseDimensions.push(RelationshipDimensionType.FAMILIARITY);

    switch (eventType) {
      case 'CONVERSATION':
        baseDimensions.push(RelationshipDimensionType.COMMUNICATION_STYLE);
        baseDimensions.push(RelationshipDimensionType.OPENNESS);
        if (quality === InteractionQuality.MEANINGFUL || quality === InteractionQuality.PROFOUND) {
          baseDimensions.push(RelationshipDimensionType.EMOTIONAL_DEPTH);
        }
        break;

      case 'SHARED_MOMENT':
        baseDimensions.push(RelationshipDimensionType.COMFORT);
        baseDimensions.push(RelationshipDimensionType.PLAYFULNESS);
        baseDimensions.push(RelationshipDimensionType.SHARED_MEMORIES);
        break;

      case 'MEMORY_CREATED':
        baseDimensions.push(RelationshipDimensionType.SHARED_MEMORIES);
        baseDimensions.push(RelationshipDimensionType.EMOTIONAL_DEPTH);
        break;

      case 'MILESTONE_REACHED':
        baseDimensions.push(RelationshipDimensionType.SUPPORTIVENESS);
        baseDimensions.push(RelationshipDimensionType.RELIABILITY);
        if (quality === InteractionQuality.MEANINGFUL || quality === InteractionQuality.PROFOUND) {
          baseDimensions.push(RelationshipDimensionType.EMOTIONAL_DEPTH);
        }
        break;

      case 'CONFLICT':
        baseDimensions.push(RelationshipDimensionType.BOUNDARIES);
        baseDimensions.push(RelationshipDimensionType.RESPECT);
        break;

      case 'REPAIR':
        baseDimensions.push(RelationshipDimensionType.RELIABILITY);
        baseDimensions.push(RelationshipDimensionType.COMMUNICATION_STYLE);
        baseDimensions.push(RelationshipDimensionType.RESPECT);
        break;

      case 'RITUAL_ESTABLISHED':
        baseDimensions.push(RelationshipDimensionType.SHARED_RITUALS);
        baseDimensions.push(RelationshipDimensionType.COMFORT);
        break;

      case 'JOKE_SHARED':
        baseDimensions.push(RelationshipDimensionType.PLAYFULNESS);
        baseDimensions.push(RelationshipDimensionType.INSIDE_JOKES);
        baseDimensions.push(RelationshipDimensionType.COMFORT);
        break;

      case 'BOUNDARY_SET':
        baseDimensions.push(RelationshipDimensionType.BOUNDARIES);
        baseDimensions.push(RelationshipDimensionType.RESPECT);
        baseDimensions.push(RelationshipDimensionType.COMMUNICATION_STYLE);
        break;

      case 'CONSISTENCY_MAINTAINED':
        baseDimensions.push(RelationshipDimensionType.RELIABILITY);
        baseDimensions.push(RelationshipDimensionType.SHARED_RITUALS);
        break;
    }

    return Array.from(new Set(baseDimensions));
  }
}
