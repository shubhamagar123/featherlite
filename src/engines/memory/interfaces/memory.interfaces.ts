import { Result } from '../../../services/types/result.type';
import {
  Memory,
  MemorySearchQuery,
  MemorySearchResult,
  MemorySnapshot,
  Entity,
  MemoryMergeResult,
  RankingScores,
  ExpiryDecision,
  EntityExtractionResult,
  ClassificationResult,
  ImportanceEvaluationResult,
  ConflictResolutionResult,
} from '../dtos/memory.dto';
import { EventEnvelope } from '../../event/dto/event.dto';
import { MemoryType, MemoryStatus } from '../enums/memory.enums';

export interface IMemoryRepository {
  save(memory: Memory): Result<Memory>;
  findById(memoryId: string): Result<Memory | null>;
  findByUserId(userId: string): Result<Memory[]>;
  findByRelationshipId(relationshipId: string): Result<Memory[]>;
  findByType(memoryType: MemoryType): Result<Memory[]>;
  findByStatus(status: MemoryStatus): Result<Memory[]>;
  update(memory: Memory): Result<Memory>;
  delete(memoryId: string): Result<void>;
  getAll(): Result<Memory[]>;
}

export interface IEntityExtractor {
  extract(text: string): Result<EntityExtractionResult>;
}

export interface IMemoryClassifier {
  classify(text: string, entities: Entity[]): Result<ClassificationResult>;
}

export interface IImportanceEvaluator {
  evaluate(memory: Partial<Memory>): Result<ImportanceEvaluationResult>;
}

export interface IExpiryEvaluator {
  evaluate(memory: Memory): Result<ExpiryDecision>;
}

export interface IConflictResolver {
  resolve(
    existingMemory: Memory,
    newMemory: Memory
  ): Result<ConflictResolutionResult>;
}

export interface IMemoryMerger {
  merge(memories: Memory[]): Result<MemoryMergeResult>;
}

export interface IMemoryIndexer {
  index(memory: Memory): Result<void>;
  clearIndex(): Result<void>;
}

export interface IMemorySearcher {
  search(query: MemorySearchQuery): Result<MemorySearchResult>;
}

export interface IMemoryRankingStrategy {
  rank(memories: Memory[]): Result<RankingScores[]>;
}

export interface IMemoryRetentionStrategy {
  decide(memories: Memory[]): Result<Memory[]>;
}

export interface IMemorySnapshotBuilder {
  buildSnapshot(
    userId: string,
    relationshipId?: string
  ): Result<MemorySnapshot>;
}

export interface IMemoryTimeline {
  addEntry(memory: Memory): Result<void>;
  getTimeline(
    userId: string,
    relationshipId?: string
  ): Result<Memory[]>;
}

export interface IMemoryOperations {
  create(
    userId: string,
    memoryType: MemoryType,
    title: string,
    description: string
  ): Result<Memory>;

  update(memory: Memory): Result<Memory>;

  merge(memoryIds: string[]): Result<MemoryMergeResult>;

  resolveConflict(
    existingMemoryId: string,
    newMemoryId: string
  ): Result<ConflictResolutionResult>;

  search(query: MemorySearchQuery): Result<MemorySearchResult>;

  expire(memoryId: string): Result<void>;

  archive(memoryId: string): Result<void>;

  buildSnapshot(
    userId: string,
    relationshipId?: string
  ): Result<MemorySnapshot>;

  getTimeline(
    userId: string,
    relationshipId?: string
  ): Result<Memory[]>;
}

export interface IMemoryEventSubscriber {
  onEvent(envelope: EventEnvelope<any>): Promise<Result<void>>;
}
