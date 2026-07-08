export {
  getMemoryExtractionEngine,
  registerMemoryExtractionEngine,
  resetMemoryExtractionEngine,
} from './memory-extraction.factory';
export type { MemoryExtractionEngineDeps } from './memory-extraction.factory';

export type { IMemoryExtractionEngine } from './interfaces/memory-extraction-engine.interface';

export type {
  ExtractedMemoryDTO,
  MemoryExtractionInputDTO,
  MemoryExtractionResultDTO,
  RetrieveCriticalMemoriesOptions,
  CriticalMemoryItemDTO,
  CriticalMemoriesSliceDTO,
} from './dtos/memory-extraction.dto';

export {
  MemoryType,
  MemoryImportance,
  MemoryExpiry,
  MemoryCategory,
} from './enums/memory-extraction.enums';
