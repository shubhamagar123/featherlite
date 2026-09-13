import type { Entity } from '@engines/memory/dtos/memory.dto';
import type { MemoryType } from '@engines/memory/enums/memory.enums';

/**
 * Raw input handed to the Memory Extraction Engine — a single unit of
 * conversation text to evaluate for memory-worthy content.
 */
export interface MemoryExtractionInput {
  userId: string;
  companionId: string;
  /** The message this text came from. Carried through to the proposal so a
   *  later consent decision can be tied back to the exact source. */
  sourceMessageId: string;
  text: string;
}

/**
 * The ONLY thing the Memory Extraction Engine ever produces: a proposed
 * memory candidate. This is a plain, inert value object — it is never
 * written anywhere by this engine. Turning it into a persisted memory is
 * entirely the caller's responsibility, gated by an explicit ConsentEvent
 * (see MemoryService.persistMemoryCandidate).
 */
export interface MemoryExtractionResultDTO {
  sourceMessageId: string;
  userId: string;
  companionId: string;
  memoryType: MemoryType;
  content: string;
  /** Raw 0..1 importance score from the importance evaluator. */
  importance: number;
  /** Raw 0..1 classification confidence. */
  confidence: number;
  entities: Entity[];
  extractedAt: Date;
}
