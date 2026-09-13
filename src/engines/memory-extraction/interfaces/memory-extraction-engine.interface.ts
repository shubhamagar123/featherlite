import type { Result } from '@services/types/result.type';
import type { MemoryExtractionInput, MemoryExtractionResultDTO } from '../dtos/memory-extraction.dtos';

/**
 * IMemoryExtractionEngine — decides whether a piece of text is worth
 * remembering and, if so, proposes a candidate.
 *
 * Contract: implementations of this interface MUST NOT depend on, import,
 * or call any persistence method (a repository, MemoryService, or Prisma).
 * The only allowed output is a MemoryExtractionResultDTO (or null when there
 * is nothing worth proposing). See ../README.md.
 */
export interface IMemoryExtractionEngine {
  /**
   * Evaluate input text and return a proposed memory candidate, or `null`
   * when nothing meets the extraction bar. Never persists anything.
   */
  extract(input: MemoryExtractionInput): Result<MemoryExtractionResultDTO | null>;
}
