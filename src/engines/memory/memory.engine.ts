import { Result } from '../../services/types/result.type';
import {
  Memory,
  MemorySearchQuery,
  MemorySearchResult,
  MemorySnapshot,
  ConflictResolutionResult,
  MemoryMergeResult,
} from './dto/memory.dto';
import { MemoryType, MemoryStatus, MemoryVisibility } from './enums/memory.enums';
import {
  IMemoryOperations,
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
import { IMemoryEngine } from './interfaces/memory-engine.interface';
import {
  MemorySnapshotDTO,
  RetrieveCriticalMemoriesOptions,
  CriticalMemoriesSliceDTO,
} from './dtos/memory-engine.dto';
import { IResult, Result as ResultAsync } from '../../services/types/result.type';
import { v4 as uuid } from 'uuid';

export class MemoryEngine implements IMemoryOperations, IMemoryEngine {
  constructor(
    private readonly repository: IMemoryRepository,
    private readonly entityExtractor: IEntityExtractor,
    private readonly classifier: IMemoryClassifier,
    private readonly importanceEvaluator: IImportanceEvaluator,
    _expiryEvaluator: IExpiryEvaluator,
    private readonly conflictResolver: IConflictResolver,
    private readonly merger: IMemoryMerger,
    private readonly indexer: IMemoryIndexer,
    private readonly timeline: IMemoryTimeline,
    private readonly searcher: IMemorySearcher,
    _rankingStrategy: IMemoryRankingStrategy,
    _retentionStrategy: IMemoryRetentionStrategy,
    private readonly snapshotBuilder: IMemorySnapshotBuilder
  ) {
    void _expiryEvaluator;
    void _rankingStrategy;
    void _retentionStrategy;
  }

  create(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _memoryType: MemoryType,
    title: string,
    description: string
  ): Result<Memory> {
    return Result.try(() => {
      const entityResult = this.entityExtractor.extract(description);
      if (!entityResult.isSuccess || !entityResult.value) {
        throw new Error(`Entity extraction failed: ${entityResult.error?.message ?? 'unknown'}`);
      }
      const entities = entityResult.value.entities;

      const classResult = this.classifier.classify(description, entities);
      if (!classResult.isSuccess || !classResult.value) {
        throw new Error(`Classification failed: ${classResult.error?.message ?? 'unknown'}`);
      }
      const classifiedType = classResult.value.memoryType;
      const confidence = classResult.value.confidence;

      const importanceResult = this.importanceEvaluator.evaluate({
        memoryType: classifiedType,
        entities,
        description,
      });
      if (!importanceResult.isSuccess || !importanceResult.value) {
        throw new Error(
          `Importance evaluation failed: ${importanceResult.error?.message ?? 'unknown'}`
        );
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
        visibility: MemoryVisibility.PRIVATE,
      };

      const saveResult = this.repository.save(memory);
      if (!saveResult.isSuccess || !saveResult.value) {
        throw new Error(`Failed to save memory: ${saveResult.error?.message ?? 'unknown'}`);
      }

      const savedMemory = saveResult.value;

      const indexResult = this.indexer.index(savedMemory);
      if (!indexResult.isSuccess) {
        throw new Error(`Indexing failed: ${indexResult.error?.message ?? 'unknown'}`);
      }

      const timelineResult = this.timeline.addEntry(savedMemory);
      if (!timelineResult.isSuccess) {
        throw new Error(`Timeline update failed: ${timelineResult.error?.message ?? 'unknown'}`);
      }

      return savedMemory;
    }) as Result<Memory>;
  }

  update(memory: Memory): Result<Memory> {
    return Result.try(() => {
      const findResult = this.repository.findById(memory.id);
      const existing = findResult.isSuccess ? findResult.value : undefined;
      if (!existing) {
        throw new Error(`Memory ${memory.id} not found`);
      }

      const updated: Memory = {
        ...memory,
        updatedAt: new Date(),
      };

      const updateResult = this.repository.update(updated);
      if (!updateResult.isSuccess) {
        throw new Error(`Failed to update memory: ${updateResult.error?.message ?? 'unknown'}`);
      }

      const indexResult = this.indexer.index(updated);
      if (!indexResult.isSuccess) {
        throw new Error(`Indexing failed: ${indexResult.error?.message ?? 'unknown'}`);
      }

      const timelineResult = this.timeline.addEntry(updated);
      if (!timelineResult.isSuccess) {
        throw new Error(`Timeline update failed: ${timelineResult.error?.message ?? 'unknown'}`);
      }

      return updated;
    }) as Result<Memory>;
  }

  merge(memoryIds: string[]): Result<MemoryMergeResult> {
    return Result.try(() => {
      const memories: Memory[] = [];

      for (const id of memoryIds) {
        const findResult = this.repository.findById(id);
        const found = findResult.isSuccess ? findResult.value : undefined;
        if (!found) {
          throw new Error(`Memory ${id} not found`);
        }
        memories.push(found);
      }

      const mergeResult = this.merger.merge(memories);
      if (!mergeResult.isSuccess || !mergeResult.value) {
        throw new Error(`Merge failed: ${mergeResult.error?.message ?? 'unknown'}`);
      }

      const mergeData = mergeResult.value;
      const saveResult = this.repository.save(mergeData.mergedMemory);
      if (!saveResult.isSuccess) {
        throw new Error(`Failed to save merged memory: ${saveResult.error?.message ?? 'unknown'}`);
      }

      for (const id of memoryIds) {
        this.repository.delete(id);
      }

      const indexResult = this.indexer.index(mergeData.mergedMemory);
      if (!indexResult.isSuccess) {
        throw new Error(`Indexing failed: ${indexResult.error?.message ?? 'unknown'}`);
      }

      const timelineResult = this.timeline.addEntry(mergeData.mergedMemory);
      if (!timelineResult.isSuccess) {
        throw new Error(`Timeline update failed: ${timelineResult.error?.message ?? 'unknown'}`);
      }

      return mergeData;
    }) as Result<MemoryMergeResult>;
  }

  resolveConflict(
    existingMemoryId: string,
    newMemoryId: string
  ): Result<ConflictResolutionResult> {
    return Result.try(() => {
      const existingResult = this.repository.findById(existingMemoryId);
      const newMemResult = this.repository.findById(newMemoryId);
      const existing = existingResult.isSuccess ? existingResult.value : undefined;
      const newMem = newMemResult.isSuccess ? newMemResult.value : undefined;

      if (!existing || !newMem) {
        throw new Error('One or both memories not found');
      }

      const resolutionResult = this.conflictResolver.resolve(existing, newMem);
      const resolution = resolutionResult.isSuccess ? resolutionResult.value : undefined;
      if (!resolution) {
        throw new Error('Conflict resolution failed');
      }

      if (resolution.resolution === 'MERGE' && resolution.mergedMemory) {
        const savedMergeResult = this.repository.save(resolution.mergedMemory);
        const savedMerge = savedMergeResult.isSuccess ? savedMergeResult.value : undefined;

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
    }) as Result<ConflictResolutionResult>;
  }

  search(query: MemorySearchQuery): Result<MemorySearchResult> {
    return this.searcher.search(query) as Result<MemorySearchResult>;
  }

  expire(memoryId: string): Result<void> {
    return Result.try(() => {
      const findResult = this.repository.findById(memoryId);
      const memory = findResult.isSuccess ? findResult.value : undefined;
      if (!memory) {
        throw new Error(`Memory ${memoryId} not found`);
      }

      const expired: Memory = {
        ...memory,
        status: MemoryStatus.EXPIRED,
        expiryAt: new Date(),
      };

      const updateResult = this.repository.update(expired);
      if (!updateResult.isSuccess) {
        throw new Error(`Failed to expire memory: ${updateResult.error?.message ?? 'unknown'}`);
      }
    }) as Result<void>;
  }

  archive(memoryId: string): Result<void> {
    return Result.try(() => {
      const findResult = this.repository.findById(memoryId);
      const memory = findResult.isSuccess ? findResult.value : undefined;
      if (!memory) {
        throw new Error(`Memory ${memoryId} not found`);
      }

      const archived: Memory = {
        ...memory,
        status: MemoryStatus.ARCHIVED,
        archivedAt: new Date(),
      };

      const updateResult = this.repository.update(archived);
      if (!updateResult.isSuccess) {
        throw new Error(`Failed to archive memory: ${updateResult.error?.message ?? 'unknown'}`);
      }
    }) as Result<void>;
  }

  buildSnapshot(
    userId: string,
    relationshipId?: string
  ): Result<MemorySnapshot> {
    return this.snapshotBuilder.buildSnapshot(userId, relationshipId) as Result<MemorySnapshot>;
  }

  getTimeline(userId: string, relationshipId?: string): Result<Memory[]> {
    return this.timeline.getTimeline(userId, relationshipId) as Result<Memory[]>;
  }

  // --------------------------------------------------------------------------
  // IMemoryEngine (external contract used by Context Engine)
  // --------------------------------------------------------------------------

  async getCriticalMemories(
    options: RetrieveCriticalMemoriesOptions
  ): Promise<IResult<CriticalMemoriesSliceDTO>> {
    return ResultAsync.tryAsync(async () => {
      const limit = options.limit ?? 10;
      const searchResult = this.searcher.search({
        searchType: 'RECENT' as unknown as MemorySearchQuery['searchType'],
        query: '',
        userId: options.companionId,
        limit,
      });
      if (!searchResult.isSuccess || !searchResult.value) {
        throw new Error(`Failed to load critical memories: ${searchResult.error?.message ?? 'unknown'}`);
      }
      const items = searchResult.value.memories
        .sort((a, b) => b.importance - a.importance)
        .slice(0, limit)
        .map((m) => ({
          id: m.id,
          type: String(m.memoryType),
          importance: this.importanceBucket(m.importance),
          content: m.description,
          accessCount: (m.metadata?.accessCount as number | undefined) ?? 0,
        }));
      return { count: items.length, items };
    });
  }

  async getMemoryById(memoryId: string): Promise<IResult<MemorySnapshotDTO | null>> {
    return ResultAsync.tryAsync(async () => {
      const findResult = this.repository.findById(memoryId);
      const memory = findResult.isSuccess ? findResult.value : undefined;
      if (!memory) return null;
      return {
        id: memory.id,
        userId: memory.userId,
        companionId: memory.relationshipId ?? '',
        type: String(memory.memoryType),
        importance: this.importanceBucket(memory.importance),
        content: memory.description,
        accessCount: (memory.metadata?.accessCount as number | undefined) ?? 0,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt,
      };
    });
  }

  private importanceBucket(score: number): string {
    if (score >= 0.75) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }
}
