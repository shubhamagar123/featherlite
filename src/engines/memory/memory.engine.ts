import { Result } from '../../services/types/result.type';
import {
  Memory,
  MemorySearchQuery,
  MemorySearchResult,
  MemorySnapshot,
  ConflictResolutionResult,
  MemoryMergeResult,
} from './dto/memory.dto';
import { MemoryType, MemoryStatus } from './enums/memory.enums';
import {
  IMemoryEngine,
  IMemoryRepository,
  IEntityExtractor,
  IMemoryClassifier,
  IImportanceEvaluator,
  IExpiryEvaluator,
  IConflictResolver,
  IMemoryMerger,
  IMemoryIndexer,
  IMemorySearcher,
  IMemoryRankingStrategy,
  IMemoryRetentionStrategy,
  IMemorySnapshotBuilder,
  IMemoryTimeline,
} from './interfaces/memory.interfaces';
import { v4 as uuid } from 'uuid';

export class MemoryEngine implements IMemoryEngine {
  constructor(
    private repository: IMemoryRepository,
    private entityExtractor: IEntityExtractor,
    private classifier: IMemoryClassifier,
    private importanceEvaluator: IImportanceEvaluator,
    private expiryEvaluator: IExpiryEvaluator,
    private conflictResolver: IConflictResolver,
    private merger: IMemoryMerger,
    private indexer: IMemoryIndexer,
    private timeline: IMemoryTimeline,
    private searcher: IMemorySearcher,
    private rankingStrategy: IMemoryRankingStrategy,
    private retentionStrategy: IMemoryRetentionStrategy,
    private snapshotBuilder: IMemorySnapshotBuilder
  ) {}

  create(
    userId: string,
    memoryType: MemoryType,
    title: string,
    description: string
  ): Result<Memory> {
    return Result.try(() => {
      const entityResult = this.entityExtractor.extract(description);
      if (!entityResult.isSuccess) {
        throw new Error(`Entity extraction failed: ${entityResult.error}`);
      }
      const entities = entityResult.value.entities;

      const classResult = this.classifier.classify(description, entities);
      if (!classResult.isSuccess) {
        throw new Error(`Classification failed: ${classResult.error}`);
      }
      const classifiedType = classResult.value.memoryType;
      const confidence = classResult.value.confidence;

      const importanceResult = this.importanceEvaluator.evaluate({
        memoryType: classifiedType,
        entities,
        description,
      });
      if (!importanceResult.isSuccess) {
        throw new Error(`Importance evaluation failed: ${importanceResult.error}`);
      }
      const importance = importanceResult.value.importance;

      const now = new Date();
      const memory: Memory = {
        id: uuid(),
        userId,
        memoryType: classifiedType,
        title,
        description,
        entities,
        confidence,
        importance,
        status: MemoryStatus.ACTIVE,
        tags: [],
        createdAt: now,
        updatedAt: now,
        visibility: 'PRIVATE',
      };

      const saveResult = this.repository.save(memory);
      if (!saveResult.isSuccess) {
        throw new Error(`Failed to save memory: ${saveResult.error}`);
      }

      const savedMemory = saveResult.value;

      const indexResult = this.indexer.index(savedMemory);
      if (!indexResult.isSuccess) {
        throw new Error(`Indexing failed: ${indexResult.error}`);
      }

      const timelineResult = this.timeline.addEntry(savedMemory);
      if (!timelineResult.isSuccess) {
        throw new Error(`Timeline update failed: ${timelineResult.error}`);
      }

      return savedMemory;
    });
  }

  update(memory: Memory): Result<Memory> {
    return Result.try(() => {
      const existing = this.repository
        .findById(memory.id)
        .getValueOrDefault(null);

      if (!existing) {
        throw new Error(`Memory ${memory.id} not found`);
      }

      const updated: Memory = {
        ...memory,
        updatedAt: new Date(),
      };

      const updateResult = this.repository.update(updated);
      if (!updateResult.isSuccess) {
        throw new Error(`Failed to update memory: ${updateResult.error}`);
      }

      const indexResult = this.indexer.index(updated);
      if (!indexResult.isSuccess) {
        throw new Error(`Indexing failed: ${indexResult.error}`);
      }

      const timelineResult = this.timeline.addEntry(updated);
      if (!timelineResult.isSuccess) {
        throw new Error(`Timeline update failed: ${timelineResult.error}`);
      }

      return updated;
    });
  }

  merge(memoryIds: string[]): Result<MemoryMergeResult> {
    return Result.try(() => {
      const memories: Memory[] = [];

      for (const id of memoryIds) {
        const found = this.repository.findById(id).getValueOrDefault(null);
        if (!found) {
          throw new Error(`Memory ${id} not found`);
        }
        memories.push(found);
      }

      const mergeResult = this.merger.merge(memories);
      if (!mergeResult.isSuccess) {
        throw new Error(`Merge failed: ${mergeResult.error}`);
      }

      const mergeData = mergeResult.value;
      const saveResult = this.repository.save(mergeData.mergedMemory);
      if (!saveResult.isSuccess) {
        throw new Error(`Failed to save merged memory: ${saveResult.error}`);
      }

      for (const id of memoryIds) {
        this.repository.delete(id);
      }

      const indexResult = this.indexer.index(mergeData.mergedMemory);
      if (!indexResult.isSuccess) {
        throw new Error(`Indexing failed: ${indexResult.error}`);
      }

      const timelineResult = this.timeline.addEntry(mergeData.mergedMemory);
      if (!timelineResult.isSuccess) {
        throw new Error(`Timeline update failed: ${timelineResult.error}`);
      }

      return mergeData;
    });
  }

  resolveConflict(
    existingMemoryId: string,
    newMemoryId: string
  ): Result<ConflictResolutionResult> {
    return Result.try(() => {
      const existing = this.repository
        .findById(existingMemoryId)
        .getValueOrDefault(null);
      const newMem = this.repository.findById(newMemoryId).getValueOrDefault(null);

      if (!existing || !newMem) {
        throw new Error('One or both memories not found');
      }

      const resolution = this.conflictResolver
        .resolve(existing, newMem)
        .getValueOrDefault(null);

      if (!resolution) {
        throw new Error('Conflict resolution failed');
      }

      if (resolution.resolution === 'MERGE' && resolution.mergedMemory) {
        const savedMerge = this.repository
          .save(resolution.mergedMemory)
          .getValueOrDefault(null);

        if (savedMerge) {
          this.repository.delete(existingMemoryId);
          this.repository.delete(newMemoryId);
          this.indexer.index(savedMerge);
          this.timeline.addEntry(savedMerge);
        }
      } else if (resolution.resolution === 'KEEP_NEW') {
        this.repository.delete(existingMemoryId);
      } else if (resolution.resolution === 'KEEP_EXISTING') {
        this.repository.delete(newMemoryId);
      }

      return resolution;
    });
  }

  search(query: MemorySearchQuery): Result<MemorySearchResult> {
    return this.searcher.search(query);
  }

  expire(memoryId: string): Result<void> {
    return Result.try(() => {
      const memory = this.repository.findById(memoryId).getValueOrDefault(null);
      if (!memory) {
        throw new Error(`Memory ${memoryId} not found`);
      }

      memory.status = MemoryStatus.EXPIRED;
      memory.expiryAt = new Date();

      this.repository.update(memory);
    });
  }

  archive(memoryId: string): Result<void> {
    return Result.try(() => {
      const memory = this.repository.findById(memoryId).getValueOrDefault(null);
      if (!memory) {
        throw new Error(`Memory ${memoryId} not found`);
      }

      memory.status = MemoryStatus.ARCHIVED;
      memory.archivedAt = new Date();

      this.repository.update(memory);
    });
  }

  buildSnapshot(
    userId: string,
    relationshipId?: string
  ): Result<MemorySnapshot> {
    return this.snapshotBuilder.buildSnapshot(userId, relationshipId);
  }

  getTimeline(userId: string, relationshipId?: string): Result<Memory[]> {
    return this.timeline.getTimeline(userId, relationshipId);
  }
}
