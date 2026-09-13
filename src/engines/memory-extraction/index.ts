export {
  getMemoryExtractionEngine,
  resetMemoryExtractionEngine,
} from './memory-extraction.factory';
export type { MemoryExtractionEngineDeps } from './memory-extraction.factory';

export { MemoryExtractionEngine } from './memory-extraction.engine';
export type { IMemoryExtractionEngine } from './interfaces/memory-extraction-engine.interface';

export type {
  MemoryExtractionInput,
  MemoryExtractionResultDTO,
} from './dtos/memory-extraction.dtos';
