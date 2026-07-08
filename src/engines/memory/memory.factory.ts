import { IMemoryOperations } from './interfaces/memory.interfaces';
import { IMemoryEngine } from './interfaces/memory-engine.interface';
import { MemoryEngine } from './memory.engine';

export type MemoryEngineHandle = IMemoryEngine & IMemoryOperations;
import { MemoryRepository } from './repositories/memory.repository';
import { EntityExtractor } from './components/entity-extractor';
import { MemoryClassifier } from './components/memory-classifier';
import { ImportanceEvaluator } from './components/importance-evaluator';
import { ExpiryEvaluator } from './components/expiry-evaluator';
import { ConflictResolver } from './components/conflict-resolver';
import { MemoryMerger } from './components/memory-merger';
import { MemoryIndexer } from './components/memory-indexer';
import { MemorySearcher } from './components/memory-searcher';
import { MemoryRankingStrategy } from './strategies/memory-ranking.strategy';
import { MemoryRetentionStrategy } from './strategies/memory-retention.strategy';
import { MemoryTimeline } from './components/memory-timeline';
import { MemorySnapshotBuilder } from './components/memory-snapshot-builder';

export interface MemoryEngineDeps {
  memoryEngine?: MemoryEngineHandle;
}

let cached: MemoryEngineHandle | null = null;

export function getMemoryEngine(_deps: MemoryEngineDeps = {}): MemoryEngineHandle {
  if (_deps.memoryEngine) {
    return _deps.memoryEngine;
  }

  if (cached) {
    return cached;
  }

  const repository = new MemoryRepository();
  const entityExtractor = new EntityExtractor();
  const memoryClassifier = new MemoryClassifier();
  const importanceEvaluator = new ImportanceEvaluator();
  const expiryEvaluator = new ExpiryEvaluator();
  const conflictResolver = new ConflictResolver();
  const memoryMerger = new MemoryMerger();
  const indexer = new MemoryIndexer();
  const memoryTimeline = new MemoryTimeline();

  const memorySearcher = new MemorySearcher(indexer, repository);

  const rankingStrategy = new MemoryRankingStrategy();
  const retentionStrategy = new MemoryRetentionStrategy();
  const snapshotBuilder = new MemorySnapshotBuilder(repository);

  cached = new MemoryEngine(
    repository,
    entityExtractor,
    memoryClassifier,
    importanceEvaluator,
    expiryEvaluator,
    conflictResolver,
    memoryMerger,
    indexer,
    memoryTimeline,
    memorySearcher,
    rankingStrategy,
    retentionStrategy,
    snapshotBuilder
  );

  return cached;
}

export function registerMemoryEngine(engine: MemoryEngineHandle): void {
  cached = engine;
}

export function resetMemoryEngine(): void {
  cached = null;
}
