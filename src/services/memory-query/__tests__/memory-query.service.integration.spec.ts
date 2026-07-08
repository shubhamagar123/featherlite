import { MemoryQueryService } from '../memory-query.service';
import { MemoryQueryType, RankingSignalType, QueryScope } from '../enums/memory-query.enums';

describe('MemoryQueryService (Integration)', () => {
  let service: MemoryQueryService;

  beforeEach(() => {
    service = new MemoryQueryService();
  });

  it('should execute a recent query with builder', () => {
    const result = service.query((b) =>
      b
        .withQueryType(MemoryQueryType.RECENT)
        .withUserId('user1')
        .withScope(QueryScope.RECENT)
        .enableSignal(RankingSignalType.RECENCY, 1.0)
    );

    expect(result.isSuccess).toBe(true);
    expect(result.value.query.queryType).toBe(MemoryQueryType.RECENT);
    expect(result.value.query.userId).toBe('user1');
  });

  it('should cache query results', () => {
    const result1 = service.queryRecent('user1');
    const result2 = service.queryRecent('user1');

    expect(result1.isSuccess).toBe(true);
    expect(result2.isSuccess).toBe(true);
    expect(result1.value.cacheKey).toBe(result2.value.cacheKey);
  });

  it('should apply filters during query', () => {
    const result = service.query((b) =>
      b
        .withQueryType(MemoryQueryType.RECENT)
        .withUserId('user1')
        .withScope(QueryScope.RECENT)
    );

    expect(result.isSuccess).toBe(true);
    expect(Array.isArray(result.value.memories)).toBe(true);
  });

  it('should support relationship-scoped queries', () => {
    const result = service.queryRecent('user1', 'rel1');

    expect(result.isSuccess).toBe(true);
    expect(result.value.query.relationshipId).toBe('rel1');
  });

  it('should execute queryByEntity', () => {
    const result = service.queryByEntity('user1', ['Alice', 'Bob']);

    expect(result.isSuccess).toBe(true);
    expect(result.value.query.queryType).toBe(MemoryQueryType.ENTITY);
  });

  it('should execute queryByTimeline', () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');
    const result = service.queryByTimeline('user1', startDate, endDate);

    expect(result.isSuccess).toBe(true);
    expect(result.value.query.queryType).toBe(MemoryQueryType.TIMELINE);
  });

  it('should execute queryPreferences', () => {
    const result = service.queryPreferences('user1');

    expect(result.isSuccess).toBe(true);
    expect(result.value.query.queryType).toBe(MemoryQueryType.PREFERENCE);
  });

  it('should execute queryRelationships', () => {
    const result = service.queryRelationships('user1');

    expect(result.isSuccess).toBe(true);
    expect(result.value.query.queryType).toBe(MemoryQueryType.RELATIONSHIP);
  });

  it('should execute queryContext', () => {
    const context = { currentActivity: 'working', recentEntities: ['Alice'] };
    const result = service.queryContext('user1', context);

    expect(result.isSuccess).toBe(true);
    expect(result.value.query.queryType).toBe(MemoryQueryType.CONTEXT);
  });

  it('should execute queryEvents', () => {
    const result = service.queryEvents('user1');

    expect(result.isSuccess).toBe(true);
    expect(result.value.query.queryType).toBe(MemoryQueryType.EVENT);
  });

  it('should return execution time metrics', () => {
    const result = service.queryRecent('user1');

    expect(result.isSuccess).toBe(true);
    expect(result.value.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.value.executedAt).toBeInstanceOf(Date);
  });

  it('should respect limit and offset', () => {
    const result = service.query((b) =>
      b
        .withQueryType(MemoryQueryType.RECENT)
        .withUserId('user1')
        .withLimit(5)
        .withOffset(0)
    );

    expect(result.isSuccess).toBe(true);
    expect(result.value.memories.length).toBeLessThanOrEqual(5);
  });

  it('should generate contextDTO with getContext', () => {
    const result = service.getContext('user1');

    expect(result.isSuccess).toBe(true);
    expect(result.value.userId).toBe('user1');
    expect(result.value.immediateMemories).toBeInstanceOf(Array);
    expect(result.value.recentMemories).toBeInstanceOf(Array);
    expect(result.value.preferences).toBeInstanceOf(Array);
    expect(result.value.relationships).toBeInstanceOf(Array);
    expect(result.value.events).toBeInstanceOf(Array);
    expect(result.value.stats).toBeDefined();
  });

  it('should support preload', () => {
    const result = service.preload('user1', 'rel1');

    expect(result.isSuccess).toBe(true);
    expect(result.value.userId).toBe('user1');
    expect(result.value.relationshipId).toBe('rel1');
  });

  it('should compute score statistics', () => {
    const result = service.getContext('user1');

    expect(result.isSuccess).toBe(true);
    expect(result.value.stats.totalRetrieved).toBeGreaterThanOrEqual(0);
    expect(result.value.stats.averageScore).toBeGreaterThanOrEqual(0);
    expect(result.value.stats.topScores).toBeInstanceOf(Array);
  });

  it('should rank memories by score', () => {
    const result = service.queryRecent('user1');

    expect(result.isSuccess).toBe(true);
    const memories = result.value.memories;

    for (let i = 0; i < memories.length - 1; i++) {
      expect(memories[i].finalScore).toBeGreaterThanOrEqual(memories[i + 1].finalScore);
    }
  });
});
