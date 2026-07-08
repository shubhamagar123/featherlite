/**
 * DefaultEvolutionStrategy — applies relationship evolution based on current state.
 *
 * Responsibilities:
 * - Recommend growth strategies based on snapshot
 * - Execute strategies to evolve dimensions
 * - Apply context-aware growth rules
 */

import { IResult, Result } from '@services/types/result.type';
import {
  RelationshipSnapshot,
  EvolutionStrategy,
  RelationshipDimension,
} from '../dtos/relationship.dtos';
import { IRelationshipEvolutionStrategy } from '../interfaces/relationship-strategy.interface';
import { IRelationshipEvaluator } from '../interfaces/relationship-evaluator.interface';
import { IRelationshipUpdater } from '../interfaces/relationship-updater.interface';
import {
  GrowthStrategyType,
  RelationshipDimensionType,
  InteractionQuality,
  RelationshipEventType,
} from '../enums/relationship.enums';

export class DefaultEvolutionStrategy implements IRelationshipEvolutionStrategy {
  constructor(
    private evaluator: IRelationshipEvaluator,
    private updater: IRelationshipUpdater
  ) {}

  recommendStrategy(snapshot: RelationshipSnapshot): IResult<EvolutionStrategy> {
    return Result.try(() => {
      const vulnerabilities = snapshot.vulnerabilities;
      const strengths = snapshot.strengths;
      const health = snapshot.overallHealth;

      if (health < 30) {
        return this.createStrategy(
          GrowthStrategyType.CONFLICT_RESOLUTION,
          10,
          'Focus on rebuilding trust through conflict resolution',
          vulnerabilities,
          14
        );
      }

      if (health < 50) {
        return this.createStrategy(
          GrowthStrategyType.EMOTIONAL_VULNERABILITY,
          9,
          'Deepen emotional connection through vulnerability',
          vulnerabilities,
          21
        );
      }

      if (vulnerabilities.length > 0) {
        return this.createStrategy(
          GrowthStrategyType.SHARED_EXPERIENCES,
          8,
          'Build shared experiences to strengthen weak dimensions',
          vulnerabilities,
          7
        );
      }

      if (health > 80) {
        return this.createStrategy(
          GrowthStrategyType.CONSISTENCY,
          7,
          'Maintain relationship through consistent interactions',
          strengths,
          3
        );
      }

      return this.createStrategy(
        GrowthStrategyType.CONVERSATION_QUALITY,
        6,
        'Increase conversation quality for deeper connection',
        [RelationshipDimensionType.EMOTIONAL_DEPTH, RelationshipDimensionType.OPENNESS],
        10
      );
    });
  }

  async execute(snapshot: RelationshipSnapshot): Promise<IResult<RelationshipSnapshot>> {
    return Result.tryAsync(async () => {
      const recommendation = this.recommendStrategy(snapshot);
      if (recommendation.isFailure) {
        throw recommendation.error;
      }

      const strategy = recommendation.value!;

      let evolved = snapshot;
      for (const dimension of strategy.targetDimensions) {
        const currentValue = snapshot.dimensions[dimension].value;
        const targetGrowth = Math.min(5, 100 - currentValue);

        if (targetGrowth > 0) {
          const mockEvent = {
            id: `evolution-${dimension}-${Date.now()}`,
            type: RelationshipEventType.CONSISTENCY_MAINTAINED,
            timestamp: new Date(),
            quality: InteractionQuality.ENGAGED,
            description: `Strategy-driven growth: ${strategy.description}`,
            affectedDimensions: [dimension],
            impact: { [dimension]: targetGrowth } as Record<RelationshipDimensionType, number>,
            metadata: { strategy: strategy.type },
          };

          const updateResult = await this.updater.applyEvent(evolved, mockEvent);
          if (updateResult.isFailure) {
            throw updateResult.error;
          }

          evolved = updateResult.value!;
        }
      }

      return evolved;
    });
  }

  private createStrategy(
    type: GrowthStrategyType,
    priority: number,
    description: string,
    targetDimensions: RelationshipDimensionType[],
    estimatedTimeToImpact: number
  ): EvolutionStrategy {
    return {
      type,
      priority: Math.min(10, Math.max(1, priority)),
      description,
      targetDimensions,
      estimatedTimeToImpact,
    };
  }
}
