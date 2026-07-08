import { IResult } from '@services/types/result.type';
import { PromptPackage, PromptBuildContext, PromptMetrics } from '../dtos/prompt.dtos';

export interface IPromptEngine {
  /**
   * Build a complete, production-ready prompt package from conversation context.
   * Never calls an LLM. Returns only the prompt structure and segments.
   */
  buildPrompt(context: PromptBuildContext): Promise<IResult<PromptPackage>>;

  /**
   * Retrieve cached prompt if available and not expired.
   */
  getCachedPrompt(cacheKey: string): Promise<IResult<PromptPackage | null>>;

  /**
   * Get metrics about prompt building (for monitoring, A/B testing).
   */
  getMetrics(templateId: string): Promise<IResult<PromptMetrics[]>>;
}
