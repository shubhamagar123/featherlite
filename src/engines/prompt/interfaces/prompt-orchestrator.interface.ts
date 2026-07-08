import { IResult } from '@services/types/result.type';
import { PromptPayload, PromptBuildContext, PromptAnalytics } from '../dtos/prompt.dtos';

export interface IPromptOrchestrator {
  /**
   * Build a complete, production-ready prompt payload from conversation context.
   * Never calls an LLM. Returns only the prompt structure and segments.
   */
  buildPrompt(context: PromptBuildContext): Promise<IResult<PromptPayload>>;

  /**
   * Retrieve cached prompt if available and not expired.
   */
  getCachedPrompt(cacheKey: string): Promise<IResult<PromptPayload | null>>;

  /**
   * Get analytics about prompt building (for monitoring, A/B testing).
   */
  getAnalytics(templateId: string): Promise<IResult<PromptAnalytics[]>>;
}
