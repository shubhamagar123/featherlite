import { IResult, Result } from '@services/types/result.type';
import { ILLMCache } from '../interfaces/llm-cache.interface';
import { LLMResponse } from '../dtos/llm-gateway.dtos';

interface CacheEntry {
  response: LLMResponse;
  expiresAt: number;
}

export class LLMCacheService implements ILLMCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  get(key: string): IResult<LLMResponse | null> {
    return Result.try(() => {
      const entry = this.cache.get(key);
      if (!entry) {
        this.misses++;
        return null;
      }
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.misses++;
        return null;
      }
      this.hits++;
      return { ...entry.response, cached: true };
    });
  }

  set(key: string, response: LLMResponse, ttlMs: number): IResult<void> {
    return Result.try(() => {
      this.cache.set(key, {
        response,
        expiresAt: Date.now() + Math.max(0, ttlMs),
      });
    });
  }

  invalidate(key: string): IResult<void> {
    return Result.try(() => {
      this.cache.delete(key);
    });
  }

  clear(): IResult<void> {
    return Result.try(() => {
      this.cache.clear();
      this.hits = 0;
      this.misses = 0;
    });
  }

  getStats(): { size: number; hits: number; misses: number } {
    return { size: this.cache.size, hits: this.hits, misses: this.misses };
  }
}
