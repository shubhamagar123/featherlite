import { MemoryQueryCache } from '../cache/memory-query-cache';
import { MemoryQueryResult } from '../dto/memory-query.dto';
import { MemoryQueryType, QueryScope, RankingMode } from '../enums/memory-query.enums';

describe('MemoryQueryCache', () => {
  let cache: MemoryQueryCache;
  let mockResult: MemoryQueryResult;

  beforeEach(() => {
    cache = new MemoryQueryCache();
    mockResult = {
      query: {
        queryType: MemoryQueryType.RECENT,
        userId: 'user1',
        scope: QueryScope.RECENT,
        filters: [],
        rankingMode: RankingMode.BALANCED,
        signals: [],
        limit: 20,
        offset: 0,
        context: {},
        createdAt: new Date(),
      },
      memories: [],
      totalCount: 0,
      executedAt: new Date(),
      executionTimeMs: 100,
      cached: false,
    };
  });

  it('should set and get a cached result', () => {
    const key = 'test-key';
    const ttl = 5 * 60 * 1000;

    const setResult = cache.set(key, mockResult, ttl);
    expect(setResult.isSuccess).toBe(true);

    const getResult = cache.get(key);
    expect(getResult.isSuccess).toBe(true);
    expect(getResult.value).toEqual(mockResult);
  });

  it('should return null for non-existent key', () => {
    const result = cache.get('non-existent');

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeNull();
  });

  it('should respect TTL and return null for expired entries', (done) => {
    const key = 'test-key';
    const ttl = 100;

    cache.set(key, mockResult, ttl);

    setTimeout(() => {
      const result = cache.get(key);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
      done();
    }, ttl + 50);
  });

  it('should delete a cached entry', () => {
    const key = 'test-key';

    cache.set(key, mockResult, 5 * 60 * 1000);
    let getResult = cache.get(key);
    expect(getResult.value).not.toBeNull();

    const deleteResult = cache.delete(key);
    expect(deleteResult.isSuccess).toBe(true);

    getResult = cache.get(key);
    expect(getResult.value).toBeNull();
  });

  it('should clear all cached entries', () => {
    cache.set('key1', mockResult, 5 * 60 * 1000);
    cache.set('key2', mockResult, 5 * 60 * 1000);

    const clearResult = cache.clear();
    expect(clearResult.isSuccess).toBe(true);

    expect(cache.get('key1').value).toBeNull();
    expect(cache.get('key2').value).toBeNull();
  });

  it('should track cache hits and misses', () => {
    const key = 'test-key';

    cache.set(key, mockResult, 5 * 60 * 1000);
    cache.get(key);
    cache.get(key);
    cache.get('non-existent');

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
  });

  it('should report cache size', () => {
    cache.set('key1', mockResult, 5 * 60 * 1000);
    cache.set('key2', mockResult, 5 * 60 * 1000);

    const stats = cache.getStats();
    expect(stats.size).toBe(2);
  });

  it('should reset stats on clear', () => {
    cache.set('key1', mockResult, 5 * 60 * 1000);
    cache.get('key1');
    cache.get('non-existent');

    cache.clear();

    const stats = cache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });

  it('should increment hit count for each cache hit', () => {
    const key = 'test-key';
    cache.set(key, mockResult, 5 * 60 * 1000);

    for (let i = 0; i < 5; i++) {
      cache.get(key);
    }

    const stats = cache.getStats();
    expect(stats.hits).toBe(5);
  });
});
