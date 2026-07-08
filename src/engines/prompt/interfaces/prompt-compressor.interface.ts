import { IResult } from '@services/types/result.type';
import { PromptPayload, CompressionStatistics } from '../dtos/prompt.dtos';
import { CompressionLevel } from '../enums/prompt.enums';

export interface IPromptCompressor {
  /**
   * Compress a prompt payload to fit within token budget.
   * Strategies: remove redundancy, summarize, prioritize, truncate.
   */
  compress(
    prompt: PromptPayload,
    maxTokens: number,
    level: CompressionLevel
  ): Promise<IResult<{ prompt: PromptPayload; stats: CompressionStatistics }>>;
}
