import { Result } from '@services/types/result.type';
import {
  MemoryQuery,
  MemoryQueryResult,
  MemoryContextDTO,
  RankingConfig,
} from './dto/memory-query.dto';
import {
  MemoryQueryType,
  RankingSignalType,
  FilterType,
  QueryScope,
  RankingMode,
} from './enums/memory-query.enums';
import {
  IMemoryQueryService,
  IMemoryQueryBuilder,
  IMemoryRetriever,
  IMemoryFilter,
  IMemoryRanker,
  IMemoryCache,
  IMemoryContextMatcher,
} from './interfaces/memory-query.interfaces';
import { MemoryQueryBuilder } from './builders/memory-query-builder';
import { MemoryRetriever } from './components/memory-retriever';
import { MemoryFilter } from './components/memory-filter';
import { MemoryRanker } from './components/memory-ranker';
import { MemoryQueryCache } from './cache/memory-query-cache';
import { MemoryContextMatcher } from './components/memory-context-matcher';
import { RecencyScorer } from './scorers/recency-scorer';
import { ImportanceScorer } from './scorers/importance-scorer';
import { ConfidenceScorer } from './scorers/confidence-scorer';
import { EntityOverlapScorer } from './scorers/entity-overlap-scorer';
import { ExpiryScorer } from './scorers/expiry-scorer';
import { RelationshipRelevanceScorer } from './scorers/relationship-relevance-scorer';
import { ConversationRelevanceScorer } from './scorers/conversation-relevance-scorer';
import { WorldRelevanceScorer } from './scorers/world-relevance-scorer';
import { FreshnessScorer } from './scorers/freshness-scorer';
import { ConversationFrequencyScorer } from './scorers/conversation-frequency-scorer';

export class MemoryQueryService implements IMemoryQueryService {
  private retriever: IMemoryRetriever;
  private filter: IMemoryFilter;
  private ranker: IMemoryRanker;
  private cache: IMemoryCache;
  private readonly contextMatcher: IMemoryContextMatcher;

  constructor() {
    this.retriever = new MemoryRetriever();
    this.filter = new MemoryFilter();
    this.ranker = new MemoryRanker();
    this.cache = new MemoryQueryCache();
    this.contextMatcher = new MemoryContextMatcher();
    // Retained for future context-based pre-filter; unused today.
    void this.contextMatcher;

    this.setupScorers();
  }

  private setupScorers(): void {
    this.ranker.addScorer(RankingSignalType.RECENCY, new RecencyScorer());
    this.ranker.addScorer(RankingSignalType.IMPORTANCE, new ImportanceScorer());
    this.ranker.addScorer(RankingSignalType.CONFIDENCE, new ConfidenceScorer());
    this.ranker.addScorer(RankingSignalType.ENTITY_OVERLAP, new EntityOverlapScorer());
    this.ranker.addScorer(RankingSignalType.EXPIRY, new ExpiryScorer());
    this.ranker.addScorer(RankingSignalType.RELATIONSHIP_RELEVANCE, new RelationshipRelevanceScorer());
    this.ranker.addScorer(RankingSignalType.CONVERSATION_RELEVANCE, new ConversationRelevanceScorer());
    this.ranker.addScorer(RankingSignalType.WORLD_RELEVANCE, new WorldRelevanceScorer());
    this.ranker.addScorer(RankingSignalType.FRESHNESS, new FreshnessScorer());
    this.ranker.addScorer(RankingSignalType.CONVERSATION_FREQUENCY, new ConversationFrequencyScorer());
  }

  query(builder: (b: IMemoryQueryBuilder) => IMemoryQueryBuilder): Result<MemoryQueryResult> {
    return Result.try(() => {
      const queryBuilder = new MemoryQueryBuilder();
      const configuredBuilder = builder(queryBuilder);
      const queryResult = configuredBuilder.build();

      if (!queryResult.isSuccess || !queryResult.value) {
        throw new Error(`Failed to build query: ${queryResult.error?.message ?? 'unknown'}`);
      }

      const query = queryResult.value;
      const startTime = Date.now();

      const cacheKey = this.generateCacheKey(query);
      const cachedResult = this.cache.get(cacheKey);

      if (cachedResult.isSuccess && cachedResult.value) {
        return {
          ...cachedResult.value,
          cached: true,
          cacheKey,
        };
      }

      const retrievedResult = this.retriever.retrieve(query);
      if (!retrievedResult.isSuccess || !retrievedResult.value) {
        throw new Error(`Memory retrieval failed: ${retrievedResult.error?.message ?? 'unknown'}`);
      }

      let memories = retrievedResult.value;

      const filteredResult = this.filter.apply(memories, query.filters);
      if (!filteredResult.isSuccess || !filteredResult.value) {
        throw new Error(`Filtering failed: ${filteredResult.error?.message ?? 'unknown'}`);
      }

      memories = filteredResult.value;

      const rankingConfig = this.buildRankingConfig(query);
      const rankedResult = this.ranker.rank(memories, rankingConfig, query.context);

      if (!rankedResult.isSuccess || !rankedResult.value) {
        throw new Error(`Ranking failed: ${rankedResult.error?.message ?? 'unknown'}`);
      }

      const rankedMemories = rankedResult.value;

      const slicedMemories = rankedMemories.slice(query.offset, query.offset + query.limit);

      const result: MemoryQueryResult = {
        query,
        memories: slicedMemories,
        totalCount: rankedMemories.length,
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime,
        cached: false,
        cacheKey,
      };

      if (query.ttl) {
        this.cache.set(cacheKey, result, query.ttl);
      }

      return result;
    });
  }

  queryRecent(userId: string, relationshipId?: string, limit?: number): Result<MemoryQueryResult> {
    return this.query((b) =>
      b
        .withUserId(userId)
        .withQueryType(MemoryQueryType.RECENT)
        .withScope(QueryScope.RECENT)
        .withLimit(limit || 20)
        .withRankingMode(RankingMode.BALANCED)
        .enableSignal(RankingSignalType.RECENCY, 1.0)
        .enableSignal(RankingSignalType.IMPORTANCE, 0.3)
        .enableSignal(RankingSignalType.CONFIDENCE, 0.2)
        .withTTL(5 * 60 * 1000)
        .withRelationshipId(relationshipId || '')
    );
  }

  queryByEntity(
    userId: string,
    entities: string[],
    relationshipId?: string
  ): Result<MemoryQueryResult> {
    return this.query((b) => {
      const builder = b
        .withUserId(userId)
        .withQueryType(MemoryQueryType.ENTITY)
        .withScope(QueryScope.CONTEXTUAL)
        .withLimit(20)
        .withRankingMode(RankingMode.BALANCED)
        .enableSignal(RankingSignalType.ENTITY_OVERLAP, 1.0)
        .enableSignal(RankingSignalType.RECENCY, 0.5)
        .enableSignal(RankingSignalType.IMPORTANCE, 0.3)
        .withContext({ recentEntities: entities })
        .withTTL(10 * 60 * 1000);

      if (relationshipId) {
        builder.withRelationshipId(relationshipId);
      }

      return builder;
    });
  }

  queryByTimeline(
    userId: string,
    startDate: Date,
    endDate: Date,
    relationshipId?: string
  ): Result<MemoryQueryResult> {
    return this.query((b) => {
      const builder = b
        .withUserId(userId)
        .withQueryType(MemoryQueryType.TIMELINE)
        .withScope(QueryScope.HISTORICAL)
        .withLimit(50)
        .withRankingMode(RankingMode.STRICT)
        .withFilter({
          type: FilterType.DATE_RANGE,
          value: { startDate, endDate },
        })
        .enableSignal(RankingSignalType.RECENCY, 1.0)
        .enableSignal(RankingSignalType.IMPORTANCE, 0.5)
        .withTTL(15 * 60 * 1000);

      if (relationshipId) {
        builder.withRelationshipId(relationshipId);
      }

      return builder;
    });
  }

  queryPreferences(userId: string, relationshipId?: string): Result<MemoryQueryResult> {
    return this.query((b) => {
      const builder = b
        .withUserId(userId)
        .withQueryType(MemoryQueryType.PREFERENCE)
        .withScope(QueryScope.FULL)
        .withLimit(30)
        .withRankingMode(RankingMode.BALANCED)
        .withFilter({
          type: FilterType.MEMORY_TYPE,
          value: 'PREFERENCE',
        })
        .enableSignal(RankingSignalType.IMPORTANCE, 1.0)
        .enableSignal(RankingSignalType.RECENCY, 0.5)
        .enableSignal(RankingSignalType.CONFIDENCE, 0.8)
        .withTTL(20 * 60 * 1000);

      if (relationshipId) {
        builder.withRelationshipId(relationshipId);
      }

      return builder;
    });
  }

  queryRelationships(userId: string, relationshipId?: string): Result<MemoryQueryResult> {
    return this.query((b) => {
      const builder = b
        .withUserId(userId)
        .withQueryType(MemoryQueryType.RELATIONSHIP)
        .withScope(QueryScope.FULL)
        .withLimit(30)
        .withRankingMode(RankingMode.BALANCED)
        .withFilter({
          type: FilterType.MEMORY_TYPE,
          value: 'RELATIONSHIP',
        })
        .enableSignal(RankingSignalType.RELATIONSHIP_RELEVANCE, 1.0)
        .enableSignal(RankingSignalType.RECENCY, 0.5)
        .enableSignal(RankingSignalType.IMPORTANCE, 0.5)
        .withTTL(20 * 60 * 1000);

      if (relationshipId) {
        builder.withRelationshipId(relationshipId);
      }

      return builder;
    });
  }

  queryContext(userId: string, context: unknown, relationshipId?: string): Result<MemoryQueryResult> {
    return this.query((b) => {
      const builder = b
        .withUserId(userId)
        .withQueryType(MemoryQueryType.CONTEXT)
        .withScope(QueryScope.CONTEXTUAL)
        .withLimit(40)
        .withRankingMode(RankingMode.BALANCED)
        .withContext(context)
        .enableSignal(RankingSignalType.WORLD_RELEVANCE, 1.0)
        .enableSignal(RankingSignalType.ENTITY_OVERLAP, 0.8)
        .enableSignal(RankingSignalType.RECENCY, 0.5)
        .enableSignal(RankingSignalType.IMPORTANCE, 0.3)
        .withTTL(5 * 60 * 1000);

      if (relationshipId) {
        builder.withRelationshipId(relationshipId);
      }

      return builder;
    });
  }

  queryEvents(userId: string, relationshipId?: string): Result<MemoryQueryResult> {
    return this.query((b) => {
      const builder = b
        .withUserId(userId)
        .withQueryType(MemoryQueryType.EVENT)
        .withScope(QueryScope.HISTORICAL)
        .withLimit(50)
        .withRankingMode(RankingMode.BALANCED)
        .withFilter({
          type: FilterType.MEMORY_TYPE,
          value: 'EVENT',
        })
        .enableSignal(RankingSignalType.RECENCY, 1.0)
        .enableSignal(RankingSignalType.IMPORTANCE, 0.8)
        .enableSignal(RankingSignalType.CONFIDENCE, 0.5)
        .withTTL(15 * 60 * 1000);

      if (relationshipId) {
        builder.withRelationshipId(relationshipId);
      }

      return builder;
    });
  }

  getContext(userId: string, relationshipId?: string, context?: unknown): Result<MemoryContextDTO> {
    return Result.try(() => {
      const queryContext = context || {};

      const immediateResult = this.queryRecent(userId, relationshipId, 5);
      const recentResult = this.queryRecent(userId, relationshipId, 10);
      const preferencesResult = this.queryPreferences(userId, relationshipId);
      const relationshipsResult = this.queryRelationships(userId, relationshipId);
      const eventsResult = this.queryEvents(userId, relationshipId);
      const contextResult = this.queryContext(userId, queryContext, relationshipId);

      const results = [immediateResult, recentResult, preferencesResult, relationshipsResult, eventsResult, contextResult];
      const failedResult = results.find((r) => !r.isSuccess || !r.value);
      if (failedResult) {
        throw new Error(`Failed to retrieve context data: ${failedResult.error?.message ?? 'unknown'}`);
      }

      // Post-narrowing helper: after the guard above we know each result has a value.
      const immediate = immediateResult.value!;
      const recent = recentResult.value!;
      const preferences = preferencesResult.value!;
      const relationships = relationshipsResult.value!;
      const events = eventsResult.value!;
      const contextRes = contextResult.value!;

      const allMemories = [
        ...immediate.memories.map((m) => m.memory),
        ...recent.memories.map((m) => m.memory),
        ...preferences.memories.map((m) => m.memory),
        ...relationships.memories.map((m) => m.memory),
        ...events.memories.map((m) => m.memory),
        ...contextRes.memories.map((m) => m.memory),
      ];

      const topScores = [
        ...immediate.memories,
        ...recent.memories,
        ...contextRes.memories,
      ]
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 10)
        .map((m) => m.finalScore);

      const avgScore = topScores.length > 0 ? topScores.reduce((a, b) => a + b, 0) / topScores.length : 0;

      const scoreDistribution: Record<string, number> = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0,
      };

      topScores.forEach((score) => {
        if (score <= 20) scoreDistribution['0-20']++;
        else if (score <= 40) scoreDistribution['21-40']++;
        else if (score <= 60) scoreDistribution['41-60']++;
        else if (score <= 80) scoreDistribution['61-80']++;
        else scoreDistribution['81-100']++;
      });

      const dto: MemoryContextDTO = {
        userId,
        relationshipId,
        immediateMemories: immediate.memories.map((m) => m.memory),
        recentMemories: recent.memories.map((m) => m.memory),
        relatedMemories: contextRes.memories.map((m) => m.memory),
        contextualMemories: contextRes.memories.map((m) => m.memory),
        preferences: preferences.memories.map((m) => m.memory),
        relationships: relationships.memories.map((m) => m.memory),
        goals: [],
        events: events.memories.map((m) => m.memory),
        stats: {
          totalRetrieved: allMemories.length,
          topScores,
          averageScore: avgScore,
          scoreDistribution,
        },
        retrievedAt: new Date(),
      };

      return dto;
    });
  }

  preload(userId: string, relationshipId?: string): Result<MemoryContextDTO> {
    return this.getContext(userId, relationshipId);
  }

  private buildRankingConfig(query: MemoryQuery): RankingConfig {
    const signalMap = new Map<RankingSignalType, number>();

    for (const signal of query.signals) {
      if (signal.enabled) {
        signalMap.set(signal.type, signal.weight);
      }
    }

    if (signalMap.size === 0) {
      signalMap.set(RankingSignalType.RECENCY, 1.0);
    }

    return {
      mode: query.rankingMode,
      signals: signalMap,
      minimumScore: 10,
      normalizeScores: true,
    };
  }

  private generateCacheKey(query: MemoryQuery): string {
    const filterString = query.filters
      .map((f) => `${f.type}:${JSON.stringify(f.value)}`)
      .join('|');

    const signalString = query.signals
      .filter((s) => s.enabled)
      .map((s) => `${s.type}:${s.weight}`)
      .join('|');

    const parts = [
      query.queryType,
      query.userId,
      query.relationshipId || '',
      query.scope,
      query.rankingMode,
      filterString,
      signalString,
      query.limit,
      query.offset,
    ];

    return Buffer.from(parts.join(':::')).toString('base64');
  }
}
