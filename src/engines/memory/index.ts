export {
  getMemoryEngine,
  registerMemoryEngine,
  resetMemoryEngine,
} from './memory.factory';
export type { MemoryEngineDeps } from './memory.factory';

export type { IMemoryEngine } from './interfaces/memory-engine.interface';

export type {
  MemorySnapshotDTO,
  RetrieveCriticalMemoriesOptions,
  CriticalMemoryItemDTO,
  CriticalMemoriesSliceDTO,
} from './dtos/memory.dto';
