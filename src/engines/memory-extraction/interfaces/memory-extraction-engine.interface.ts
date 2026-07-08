import { IResult } from '@services/types/result.type';
import {
  MemoryExtractionInputDTO,
  MemoryExtractionResultDTO,
} from '../dtos/memory-extraction.dto';

export interface IMemoryExtractionEngine {
  /**
   * Extract, classify, and rank memories from raw input.
   * Performs entity extraction, importance detection, expiry assignment,
   * and categorization. Does NOT persist — only produces a validated list.
   */
  extractMemories(
    input: MemoryExtractionInputDTO
  ): Promise<IResult<MemoryExtractionResultDTO>>;
}
