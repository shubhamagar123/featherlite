import type { IMemoryEngine } from './interfaces/memory-engine.interface';

export interface MemoryEngineDeps {
  memoryEngine?: IMemoryEngine;
}

let cached: IMemoryEngine | null = null;

export function getMemoryEngine(_deps: MemoryEngineDeps = {}): IMemoryEngine {
  if (_deps.memoryEngine) {
    return _deps.memoryEngine;
  }

  if (cached) {
    return cached;
  }

  throw new Error(
    'MemoryEngine: no implementation registered yet. ' +
      'Call getMemoryEngine({ memoryEngine }) with a concrete instance first.'
  );
}

export function registerMemoryEngine(engine: IMemoryEngine): void {
  cached = engine;
}

export function resetMemoryEngine(): void {
  cached = null;
}
