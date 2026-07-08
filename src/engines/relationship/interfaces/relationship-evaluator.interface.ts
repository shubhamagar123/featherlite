import { IResult } from '@services/types/result.type';
import {
  InteractionEvaluationInput,
  InteractionEvaluationResult,
  GrowthFactorScore,
} from '../dtos/relationship.dtos';
import type { ConversationContextDTO } from '@engines/context';

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
    conversationContext: ConversationContextDTO
  ): Promise<IResult<GrowthFactorScore>>;
}
