import Redis from 'ioredis';
import { Result } from '@services/types/result.type';
import { MemoryQueryResult } from '@engines/memory-query/dto/memory-query.dto';
import { IMemoryCache } from '@engines/memory-query/interfaces/memory-query.interfaces';
import { RedisL1Cache } from './redis-l1-cache.base';

/**
 * Redis-backed memory query cache with in-process L1 LRU layer.
 * Caches memory query results to avoid repeated expensive queries.
 */
export class RedisMemoryCache extends RedisL1Cache<MemoryQueryResult> implements IMemoryCache {
  constructor(redisClient: Redis) {
    super(redisClient, 'memory-cache', 'RedisMemoryCache', {
      max: 500,
      maxSize: 100 * 1024 * 1024,
    });
  }

  get(key: string): Result<MemoryQueryResult | null> {
    return Result.try(() => {
      return this.getFromCacheSync(key);
    });
  }

  set(key: string, result: MemoryQueryResult, ttl: number): Result<void> {
    return Result.try(() => {
      this.setInCacheSync(key, result, ttl);
    });
  }

  delete(key: string): Result<void> {
    return Result.try(() => {
      this.deleteFromCacheSync(key);
    });
  }

  clear(): Result<void> {
    return Result.try(() => {
      this.l1Cache.clear();
      this.stats.hits = 0;
      this.stats.misses = 0;
      this.logger.debug('Memory cache cleared');
    });
  }

  getStats(): { size: number; hits: number; misses: number } {
    const stats = this.getCacheStats();
    return {
      size: stats.l1Size,
      hits: stats.hits,
      misses: stats.misses,
    };
  }

  private getFromCacheSync(key: string): MemoryQueryResult | null {
    try {
      const now = Date.now();
      const l1Entry = this.l1Cache.get(key);

      if (l1Entry && l1Entry.expiresAt > now) {
        this.stats.hits++;
        this.stats.l1Hits++;
        this.logger.debug({ key, source: 'L1' }, 'Memory cache hit');
        return l1Entry.value;
      }

      if (l1Entry) {
        this.l1Cache.delete(key);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this.logger.error({ error, key }, 'Memory cache get error');
      return null;
    }
  }

  private setInCacheSync(key: string, value: MemoryQueryResult, ttl: number): void {
    try {
      const now = Date.now();
      const expiresAt = now + Math.min(ttl, this.l1MaxTtlMs);
      this.l1Cache.set(key, { value, expiresAt });
      this.logger.debug({ key, ttl }, 'Memory cache set');
    } catch (error) {
      this.logger.error({ error, key }, 'Memory cache set error');
    }
  }

  private deleteFromCacheSync(key: string): void {
    try {
      this.l1Cache.delete(key);
      this.logger.debug({ key }, 'Memory cache deleted');
    } catch (error) {
      this.logger.error({ error, key }, 'Memory cache delete error');
    }
  }
}
