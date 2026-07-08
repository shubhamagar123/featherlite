import { IResult } from '@services/types/result.type';
import { PromptPackage, CompressionStatistics } from '../dtos/prompt.dtos';
import { CompressionLevel } from '../enums/prompt.enums';

export interface IPromptCompressor {
  /**
   * Compress a prompt package to fit within token budget.
   * Strategies: remove redundancy, summarize, prioritize, truncate.
   */
  compress(
    prompt: PromptPackage,
    maxTokens: number,
    level: CompressionLevel
  ): Promise<IResult<{ prompt: PromptPackage; stats: CompressionStatistics }>>;
}
