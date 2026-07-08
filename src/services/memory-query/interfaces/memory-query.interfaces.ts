import { Result } from '../../../services/types/result.type';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import {
  FilterCriteria,
  MemoryQuery,
  MemoryQueryResult,
  MemoryContextDTO,
  RankingConfig,
  RankedMemory,
} from '../dto/memory-query.dto';
import { RankingSignalType, QueryScope, RankingMode, MemoryQueryType } from '../enums/memory-query.enums';

export interface IMemoryQueryBuilder {
  withQueryType(type: MemoryQueryType): IMemoryQueryBuilder;
  withUserId(userId: string): IMemoryQueryBuilder;
  withRelationshipId(relationshipId: string): IMemoryQueryBuilder;
  withScope(scope: QueryScope): IMemoryQueryBuilder;
  withLimit(limit: number): IMemoryQueryBuilder;
  withOffset(offset: number): IMemoryQueryBuilder;
  withFilter(filter: FilterCriteria): IMemoryQueryBuilder;
  withRankingMode(mode: RankingMode): IMemoryQueryBuilder;
  withContext(context: unknown): IMemoryQueryBuilder;
  withTTL(ttlMs: number): IMemoryQueryBuilder;
  enableSignal(type: RankingSignalType, weight: number): IMemoryQueryBuilder;
  disableSignal(type: RankingSignalType): IMemoryQueryBuilder;
  build(): Result<MemoryQuery>;
}

export interface IMemoryScorer {
  score(memories: Memory[], context: any): Result<Map<string, number>>;
}

export interface IMemoryRanker {
  rank(memories: Memory[], config: RankingConfig, context: any): Result<RankedMemory[]>;
  addScorer(type: RankingSignalType, scorer: IMemoryScorer): void;
}

export interface IMemoryFilter {
  apply(memories: Memory[], criteria: FilterCriteria[]): Result<Memory[]>;
}

export interface IMemoryRetriever {
  retrieve(query: MemoryQuery): Result<Memory[]>;
}

export interface IMemoryCache {
  get(key: string): Result<MemoryQueryResult | null>;
  set(key: string, result: MemoryQueryResult, ttl: number): Result<void>;
  delete(key: string): Result<void>;
  clear(): Result<void>;
  getStats(): { size: number; hits: number; misses: number };
}

export interface IMemoryContextMatcher {
  matchContext(memories: Memory[], context: any): Result<number[]>;
}

export interface IMemoryQueryService {
  query(builder: (b: IMemoryQueryBuilder) => IMemoryQueryBuilder): Result<MemoryQueryResult>;

  queryRecent(userId: string, relationshipId?: string, limit?: number): Result<MemoryQueryResult>;

  queryByEntity(userId: string, entities: string[], relationshipId?: string): Result<MemoryQueryResult>;

  queryByTimeline(
    userId: string,
    startDate: Date,
    endDate: Date,
    relationshipId?: string
  ): Result<MemoryQueryResult>;

  queryPreferences(userId: string, relationshipId?: string): Result<MemoryQueryResult>;

  queryRelationships(userId: string, relationshipId?: string): Result<MemoryQueryResult>;

  queryContext(userId: string, context: unknown, relationshipId?: string): Result<MemoryQueryResult>;

  queryEvents(userId: string, relationshipId?: string): Result<MemoryQueryResult>;

  getContext(userId: string, relationshipId?: string, context?: unknown): Result<MemoryContextDTO>;

  preload(userId: string, relationshipId?: string): Result<MemoryContextDTO>;
}

export interface IMemoryQueryFactory {
  createQueryService(): IMemoryQueryService;
  createQueryBuilder(): IMemoryQueryBuilder;
  createRanker(): IMemoryRanker;
  createFilter(): IMemoryFilter;
  createRetriever(): IMemoryRetriever;
  createCache(): IMemoryCache;
}
