import { Memory, MemorySearchQuery } from '../../../engines/memory/dto/memory.dto';
import {
  MemoryQueryType,
  RankingSignalType,
  FilterType,
  QueryScope,
  RankingMode,
} from '../enums/memory-query.enums';

export interface FilterCriteria {
  type: FilterType;
  value: any;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
}

export interface RankingSignal {
  type: RankingSignalType;
  weight: number;
  enabled: boolean;
}

export interface MemoryQuery {
  queryType: MemoryQueryType;
  userId: string;
  relationshipId?: string;
  scope: QueryScope;
  filters: FilterCriteria[];
  rankingMode: RankingMode;
  signals: RankingSignal[];
  limit: number;
  offset: number;
  context?: {
    currentActivity?: string;
    currentScene?: string;
    currentMood?: string;
    recentEntities?: string[];
    conversationHistory?: string[];
  };
  createdAt: Date;
  ttl?: number;
}

export interface RankedMemory {
  memory: Memory;
  scores: Record<RankingSignalType, number>;
  finalScore: number;
  reasoning: string;
  rank: number;
}

export interface MemoryQueryResult {
  query: MemoryQuery;
  memories: RankedMemory[];
  totalCount: number;
  executedAt: Date;
  executionTimeMs: number;
  cached: boolean;
  cacheKey?: string;
}

export interface MemoryContextDTO {
  userId: string;
  relationshipId?: string;
  immediateMemories: Memory[];
  recentMemories: Memory[];
  relatedMemories: Memory[];
  contextualMemories: Memory[];
  preferences: Memory[];
  relationships: Memory[];
  goals: Memory[];
  events: Memory[];
  stats: {
    totalRetrieved: number;
    topScores: number[];
    averageScore: number;
    scoreDistribution: Record<string, number>;
  };
  retrievedAt: Date;
  ttl?: number;
}

export interface MemorySearchAdapter {
  toMemorySearchQuery(query: MemoryQuery): MemorySearchQuery;
}

export interface RankingConfig {
  mode: RankingMode;
  signals: Map<RankingSignalType, number>;
  minimumScore: number;
  normalizeScores: boolean;
}

export interface QueryCacheEntry {
  key: string;
  result: MemoryQueryResult;
  createdAt: Date;
  ttl: number;
  hits: number;
}
