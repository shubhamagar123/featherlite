import type { IMemoryExtractionEngine } from './interfaces/memory-extraction-engine.interface';

export interface MemoryExtractionEngineDeps {
  memoryExtractionEngine?: IMemoryExtractionEngine;
}

let cached: IMemoryExtractionEngine | null = null;

export function getMemoryExtractionEngine(
  _deps: MemoryExtractionEngineDeps = {}
): IMemoryExtractionEngine {
  if (_deps.memoryExtractionEngine) {
    return _deps.memoryExtractionEngine;
  }

  if (cached) {
    return cached;
  }

  throw new Error(
    'MemoryExtractionEngine: no implementation registered yet. ' +
      'Call getMemoryExtractionEngine({ memoryExtractionEngine }) with a concrete instance first.'
  );
}

export function registerMemoryExtractionEngine(engine: IMemoryExtractionEngine): void {
  cached = engine;
}

export function resetMemoryExtractionEngine(): void {
  cached = null;
}
