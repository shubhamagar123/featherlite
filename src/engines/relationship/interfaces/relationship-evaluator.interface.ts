import { IResult } from '@services/types/result.type';
import {
  InteractionEvaluationInput,
  InteractionEvaluationResult,
  GrowthFactorScore,
} from '../dtos/relationship.dtos';
import type { InteractionContextDTO } from '@engines/context';

export interface IRelationshipEvaluator {
  /**
   * Evaluate an interaction's quality and impact on relationship dimensions.
   */
  evaluateInteraction(input: InteractionEvaluationInput): Promise<IResult<InteractionEvaluationResult>>;

  /**
   * Score growth factors based on conversation history and events.
   */
  scoreGrowthFactors(
    userId: string,
    companionId: string,
    conversationContext: InteractionContextDTO
  ): Promise<IResult<GrowthFactorScore>>;
}
