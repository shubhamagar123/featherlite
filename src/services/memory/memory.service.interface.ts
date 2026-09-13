import { IResult } from '../types/result.type';
import { MemoryDTO } from '../dtos/memory.dto';
import { CreateMemoryDTO, UpdateMemoryDTO, ConsentEvent } from '../dtos/memory.dto';
import type { MemoryExtractionResultDTO } from '@engines/memory-extraction';

export interface IMemoryService {
  createMemory(dto: CreateMemoryDTO): Promise<IResult<MemoryDTO>>;
  getMemoryById(memoryId: string): Promise<IResult<MemoryDTO>>;
  getMemoriesByCompanionId(companionId: string, limit?: number): Promise<IResult<MemoryDTO[]>>;
  getCriticalMemories(companionId: string, limit?: number): Promise<IResult<MemoryDTO[]>>;
  updateMemory(memoryId: string, dto: UpdateMemoryDTO): Promise<IResult<MemoryDTO>>;
  deleteMemory(memoryId: string): Promise<IResult<void>>;
  incrementAccessCount(memoryId: string): Promise<IResult<void>>;

  /**
   * The ONLY path from a Memory Extraction Engine proposal to storage.
   * Writes nothing unless `consent.granted` is true and `consent
   * .sourceMessageId` matches `candidate.sourceMessageId`. When consent is
   * withheld (or doesn't match), the candidate is discarded — nothing is
   * persisted, including no "pending"/"rejected" record — and this resolves
   * successfully with `value: null`.
   */
  persistMemoryCandidate(
    candidate: MemoryExtractionResultDTO,
    consent: ConsentEvent
  ): Promise<IResult<MemoryDTO | null>>;
}
