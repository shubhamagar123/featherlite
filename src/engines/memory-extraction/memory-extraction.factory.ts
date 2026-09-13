import { EntityExtractor } from '@engines/memory/components/entity-extractor';
import { MemoryClassifier } from '@engines/memory/components/memory-classifier';
import { ImportanceEvaluator } from '@engines/memory/components/importance-evaluator';
import { MemoryExtractionEngine } from './memory-extraction.engine';
import type { IMemoryExtractionEngine } from './interfaces/memory-extraction-engine.interface';

export interface MemoryExtractionEngineDeps {
  memoryExtractionEngine?: IMemoryExtractionEngine;
}

let cached: IMemoryExtractionEngine | null = null;

/**
 * Build (or return the cached) Memory Extraction Engine.
 *
 * The engine is wired only with pure decision components (entity
 * extraction, classification, importance scoring) — never a repository or
 * MemoryService. That omission is intentional: see
 * src/engines/memory-extraction/README.md.
 */
export function getMemoryExtractionEngine(
  deps: MemoryExtractionEngineDeps = {}
): IMemoryExtractionEngine {
  if (deps.memoryExtractionEngine) {
    return deps.memoryExtractionEngine;
  }

  if (cached) {
    return cached;
  }

  cached = new MemoryExtractionEngine(
    new EntityExtractor(),
    new MemoryClassifier(),
    new ImportanceEvaluator()
  );

  return cached;
}

export function resetMemoryExtractionEngine(): void {
  cached = null;
}
