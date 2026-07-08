import { MemoryQueryBuilder } from '../builders/memory-query-builder';
import {
  MemoryQueryType,
  RankingSignalType,
  QueryScope,
  RankingMode,
  FilterType,
} from '../enums/memory-query.enums';

describe('MemoryQueryBuilder', () => {
  let builder: MemoryQueryBuilder;

  beforeEach(() => {
    builder = new MemoryQueryBuilder();
  });

  it('should build a valid query with all required fields', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withScope(QueryScope.RECENT)
      .enableSignal(RankingSignalType.RECENCY, 1.0)
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.queryType).toBe(MemoryQueryType.RECENT);
    expect(result.value.userId).toBe('user1');
    expect(result.value.scope).toBe(QueryScope.RECENT);
  });

  it('should fail if query type is missing', () => {
    const result = builder.withUserId('user1').build();

    expect(result.isSuccess).toBe(false);
  });

  it('should fail if user ID is missing', () => {
    const result = builder.withQueryType(MemoryQueryType.RECENT).build();

    expect(result.isSuccess).toBe(false);
  });

  it('should set relationship ID if provided', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withRelationshipId('rel1')
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.relationshipId).toBe('rel1');
  });

  it('should add multiple filters', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withFilter({
        type: FilterType.MEMORY_TYPE,
        value: 'FACT',
      })
      .withFilter({
        type: FilterType.IMPORTANCE,
        value: 0.5,
        operator: 'gte',
      })
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.filters).toHaveLength(2);
  });

  it('should enable multiple signals', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .enableSignal(RankingSignalType.RECENCY, 1.0)
      .enableSignal(RankingSignalType.IMPORTANCE, 0.5)
      .enableSignal(RankingSignalType.CONFIDENCE, 0.3)
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.signals).toHaveLength(3);
  });

  it('should disable signals', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .enableSignal(RankingSignalType.RECENCY, 1.0)
      .enableSignal(RankingSignalType.IMPORTANCE, 0.5)
      .disableSignal(RankingSignalType.IMPORTANCE)
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.signals.filter((s) => s.enabled)).toHaveLength(1);
  });

  it('should set ranking mode', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withRankingMode(RankingMode.STRICT)
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.rankingMode).toBe(RankingMode.STRICT);
  });

  it('should set pagination limits', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withLimit(50)
      .withOffset(10)
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.limit).toBe(50);
    expect(result.value.offset).toBe(10);
  });

  it('should clamp limit to valid range', () => {
    const resultTooLarge = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withLimit(10000)
      .build();

    expect(resultTooLarge.value.limit).toBeLessThanOrEqual(1000);

    const resultTooSmall = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withLimit(0)
      .build();

    expect(resultTooSmall.value.limit).toBeGreaterThanOrEqual(1);
  });

  it('should clamp offset to non-negative', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withOffset(-10)
      .build();

    expect(result.value.offset).toBeGreaterThanOrEqual(0);
  });

  it('should set context', () => {
    const context = { currentActivity: 'working', recentEntities: ['Alice'] };

    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withContext(context)
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.context).toEqual(context);
  });

  it('should set TTL', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .withTTL(5 * 60 * 1000)
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.ttl).toBe(5 * 60 * 1000);
  });

  it('should default to CONTEXTUAL scope', () => {
    const result = builder.withQueryType(MemoryQueryType.RECENT).withUserId('user1').build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.scope).toBe(QueryScope.CONTEXTUAL);
  });

  it('should support fluent chaining', () => {
    const result = builder
      .withQueryType(MemoryQueryType.ENTITY)
      .withUserId('user1')
      .withRelationshipId('rel1')
      .withScope(QueryScope.RECENT)
      .withLimit(30)
      .withRankingMode(RankingMode.BALANCED)
      .withFilter({ type: FilterType.MEMORY_TYPE, value: 'FACT' })
      .enableSignal(RankingSignalType.RECENCY, 1.0)
      .build();

    expect(result.isSuccess).toBe(true);
    expect(result.value.queryType).toBe(MemoryQueryType.ENTITY);
    expect(result.value.userId).toBe('user1');
    expect(result.value.relationshipId).toBe('rel1');
  });

  it('should clamp signal weights to 0-1 range', () => {
    const result = builder
      .withQueryType(MemoryQueryType.RECENT)
      .withUserId('user1')
      .enableSignal(RankingSignalType.RECENCY, 2.0)
      .enableSignal(RankingSignalType.IMPORTANCE, -0.5)
      .build();

    expect(result.isSuccess).toBe(true);
    result.value.signals.forEach((s) => {
      expect(s.weight).toBeGreaterThanOrEqual(0);
      expect(s.weight).toBeLessThanOrEqual(1);
    });
  });
});
