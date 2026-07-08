import { IResult, Result } from '@services/types/result.type';
import { IPromptCacheService } from '../interfaces/prompt-cache-service.interface';
import { PromptPayload } from '../dtos/prompt.dtos';

interface CacheEntry {
  payload: PromptPayload;
  expiresAt: number;
}

export class PromptCacheService implements IPromptCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  async get(key: string): Promise<IResult<PromptPayload | null>> {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return Result.success(null);
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return Result.success(null);
    }
    this.hits++;
    return Result.success({ ...entry.payload, cached: true, cachedAt: new Date() });
  }

  async set(key: string, prompt: PromptPayload, ttlSeconds: number): Promise<IResult<void>> {
    this.cache.set(key, {
      payload: { ...prompt, cacheKey: key },
      expiresAt: Date.now() + Math.max(0, ttlSeconds) * 1000,
    });
    return Result.success(undefined);
  }

  async invalidate(key: string): Promise<IResult<void>> {
    this.cache.delete(key);
    return Result.success(undefined);
  }

  async getStats(): Promise<IResult<{ hits: number; misses: number; size: number }>> {
    return Result.success({ hits: this.hits, misses: this.misses, size: this.cache.size });
  }

  reset(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}
