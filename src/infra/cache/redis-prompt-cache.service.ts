import Redis from 'ioredis';
import { IResult, Result } from '@services/types/result.type';
import { PromptPayload } from '@engines/prompt/dtos/prompt.dtos';
import { IPromptCacheService } from '@engines/prompt/interfaces/prompt-cache-service.interface';
import { RedisL1Cache } from './redis-l1-cache.base';

/**
 * Redis-backed prompt cache with in-process L1 LRU layer.
 * Caches compiled prompts to avoid re-composition on repeated queries.
 */
export class RedisPromptCacheService extends RedisL1Cache<PromptPayload>
  implements IPromptCacheService {

  constructor(redisClient: Redis) {
    super(redisClient, 'prompt-cache', 'RedisPromptCache', {
      max: 1000,
      maxSize: 50 * 1024 * 1024,
    });
  }

  async get(key: string): Promise<IResult<PromptPayload | null>> {
    try {
      const value = await this.getFromCache(key);
      return Result.success(value);
    } catch (error) {
      return Result.failure(new Error(`Failed to get prompt from cache: ${String(error)}`));
    }
  }

  async set(key: string, prompt: PromptPayload, ttlSeconds: number): Promise<IResult<void>> {
    try {
      await this.setInCache(key, prompt, ttlSeconds);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(new Error(`Failed to set prompt in cache: ${String(error)}`));
    }
  }

  async invalidate(key: string): Promise<IResult<void>> {
    try {
      await this.deleteFromCache(key);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(new Error(`Failed to invalidate prompt cache: ${String(error)}`));
    }
  }

  async getStats(): Promise<IResult<{ hits: number; misses: number; size: number }>> {
    try {
      const stats = this.getCacheStats();
      return Result.success({
        hits: stats.hits,
        misses: stats.misses,
        size: stats.l1Size,
      });
    } catch (error) {
      return Result.failure(new Error(`Failed to get cache stats: ${String(error)}`));
    }
  }
}
