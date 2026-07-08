import { IResult } from '@services/types/result.type';
import { PromptBuildContext, PromptSegment } from '../dtos/prompt.dtos';

export interface IPromptStrategy {
  /**
   * Execute a specific prompt building strategy.
   * Strategies define how to structure and prioritize content.
   */
  execute(context: PromptBuildContext, segments: PromptSegment[]): Promise<IResult<PromptSegment[]>>;
}
