import { IResult } from '@services/types/result.type';
import {
  MemorySnapshotDTO,
  RetrieveCriticalMemoriesOptions,
  CriticalMemoriesSliceDTO,
} from '../dtos/memory.dto';

export interface IMemoryEngine {
  /**
   * Retrieve the companion's most critical/salient memories.
   * Used by Context Engine to populate the memory slice for conversations.
   */
  getCriticalMemories(
    options: RetrieveCriticalMemoriesOptions
  ): Promise<IResult<CriticalMemoriesSliceDTO>>;

  /**
   * Fetch a single memory by ID.
   */
  getMemoryById(memoryId: string): Promise<IResult<MemorySnapshotDTO | null>>;
}
