import Redis from 'ioredis';
import { Result } from '@services/types/result.type';
import { LLMResponse } from '@engines/llm-gateway/dtos/llm-gateway.dtos';
import { ILLMCache } from '@engines/llm-gateway/interfaces/llm-cache.interface';
import { RedisL1Cache } from './redis-l1-cache.base';

/**
 * Redis-backed LLM response cache with in-process L1 LRU layer.
 * Caches LLM responses to avoid redundant API calls for identical prompts.
 */
export class RedisLLMCache extends RedisL1Cache<LLMResponse> implements ILLMCache {
  constructor(redisClient: Redis) {
    super(redisClient, 'llm-cache', 'RedisLLMCache', {
      max: 500,
      maxSize: 100 * 1024 * 1024,
    });
  }

  get(key: string): Result<LLMResponse | null> {
    return Result.try(() => {
      return this.getFromCacheSync(key);
    });
  }

  set(key: string, response: LLMResponse, ttlMs: number): Result<void> {
    return Result.try(() => {
      this.setInCacheSync(key, response, ttlMs);
    });
  }

  invalidate(key: string): Result<void> {
    return Result.try(() => {
      this.deleteFromCacheSync(key);
    });
  }

  clear(): Result<void> {
    return Result.try(() => {
      this.l1Cache.clear();
      this.logger.debug('LLM cache cleared');
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

  private getFromCacheSync(key: string): LLMResponse | null {
    try {
      const now = Date.now();
      const l1Entry = this.l1Cache.get(key);

      if (l1Entry && l1Entry.expiresAt > now) {
        this.stats.hits++;
        this.stats.l1Hits++;
        return l1Entry.value;
      }

      if (l1Entry) {
        this.l1Cache.delete(key);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this.logger.error({ error, key }, 'LLM cache get error');
      return null;
    }
  }

  private setInCacheSync(key: string, value: LLMResponse, ttlMs: number): void {
    try {
      const now = Date.now();
      const expiresAt = now + Math.min(ttlMs, this.l1MaxTtlMs);
      this.l1Cache.set(key, { value, expiresAt });
    } catch (error) {
      this.logger.error({ error, key }, 'LLM cache set error');
    }
  }

  private deleteFromCacheSync(key: string): void {
    try {
      this.l1Cache.delete(key);
    } catch (error) {
      this.logger.error({ error, key }, 'LLM cache delete error');
    }
  }
}
