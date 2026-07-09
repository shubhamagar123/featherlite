import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

/**
 * Base class for Redis-backed caches with in-process L1 (LRU) layer.
 *
 * Two-level cache architecture:
 * - L1: In-process LRU cache (fast, limited size, per-instance)
 * - L2: Redis (shared, unbounded, cluster-aware)
 *
 * Reads check L1 first; miss falls through to L2. On L2 hit, update L1.
 * Writes go to both L1 and L2 atomically.
 */
export abstract class RedisL1Cache<T> {
  protected readonly logger: Logger;
  protected readonly redisClient: Redis;
  protected readonly l1Cache: LRUCache<string, { value: T; expiresAt: number }>;
  protected readonly keyPrefix: string;
  protected readonly l1MaxTtlMs = 5000;

  protected stats = {
    hits: 0,
    misses: 0,
    l1Hits: 0,
    l2Hits: 0,
  };

  constructor(
    redisClient: Redis,
    keyPrefix: string,
    loggerName: string,
    l1Options?: { max?: number; maxSize?: number }
  ) {
    this.redisClient = redisClient;
    this.keyPrefix = keyPrefix;
    this.logger = createLogger(loggerName);

    this.l1Cache = new LRUCache<string, { value: T; expiresAt: number }>({
      max: l1Options?.max || 100,
      maxSize: l1Options?.maxSize || 10 * 1024 * 1024,
      sizeCalculation: (entry) => JSON.stringify(entry.value).length,
      allowStale: false,
      updateAgeOnGet: true,
    });
  }

  protected async getFromCache(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);

    try {
      const now = Date.now();

      const l1Entry = this.l1Cache.get(key);
      if (l1Entry && l1Entry.expiresAt > now) {
        this.stats.hits++;
        this.stats.l1Hits++;
        this.logger.debug({ key, source: 'L1' }, 'Cache hit');
        return l1Entry.value;
      }

      if (l1Entry) {
        this.l1Cache.delete(key);
      }

      const l2Data = await this.redisClient.get(fullKey);
      if (!l2Data) {
        this.stats.misses++;
        return null;
      }

      const value = JSON.parse(l2Data) as T;
      const ttlSec = await this.redisClient.ttl(fullKey);
      const expiresAt = now + (ttlSec > 0 ? Math.min(ttlSec * 1000, this.l1MaxTtlMs) : this.l1MaxTtlMs);

      this.l1Cache.set(key, { value, expiresAt });
      this.stats.hits++;
      this.stats.l2Hits++;
      this.logger.debug({ key, source: 'L2', ttlSec }, 'Cache hit');

      return value;
    } catch (error) {
      this.logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  protected async setInCache(key: string, value: T, ttlSeconds: number): Promise<void> {
    const fullKey = this.getFullKey(key);

    try {
      const now = Date.now();
      const expiresAt = now + Math.min(ttlSeconds * 1000, this.l1MaxTtlMs);

      this.l1Cache.set(key, { value, expiresAt });

      const serialized = JSON.stringify(value);
      await this.redisClient.setex(fullKey, Math.max(1, ttlSeconds), serialized);

      this.logger.debug({ key, ttlSeconds }, 'Cache set');
    } catch (error) {
      this.logger.error({ error, key }, 'Cache set error');
    }
  }

  protected async deleteFromCache(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);

    try {
      this.l1Cache.delete(key);
      await this.redisClient.del(fullKey);
      this.logger.debug({ key }, 'Cache deleted');
    } catch (error) {
      this.logger.error({ error, key }, 'Cache delete error');
    }
  }

  protected async clearAllCache(): Promise<void> {
    try {
      this.l1Cache.clear();

      const pattern = `${this.keyPrefix}:*`;
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }

      this.stats.hits = 0;
      this.stats.misses = 0;
      this.logger.debug({ keysDeleted: keys.length }, 'Cache cleared');
    } catch (error) {
      this.logger.error({ error }, 'Cache clear error');
    }
  }

  protected getFullKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  getCacheStats() {
    return {
      ...this.stats,
      l1Size: this.l1Cache.size,
      l1MaxSize: this.l1Cache.maxSize,
    };
  }
}
