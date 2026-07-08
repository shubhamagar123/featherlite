import { Result } from '../../../services/types/result.type';
import { MemoryQueryResult, QueryCacheEntry } from '../dto/memory-query.dto';
import { IMemoryCache } from '../interfaces/memory-query.interfaces';

export class MemoryQueryCache implements IMemoryCache {
  private cache: Map<string, QueryCacheEntry> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  get(key: string): Result<MemoryQueryResult | null> {
    return Result.try(() => {
      const entry = this.cache.get(key);

      if (!entry) {
        this.misses++;
        return null;
      }

      const now = new Date();
      const ageMs = now.getTime() - entry.createdAt.getTime();

      if (ageMs > entry.ttl) {
        this.cache.delete(key);
        this.misses++;
        return null;
      }

      entry.hits++;
      this.hits++;
      return entry.result;
    });
  }

  set(key: string, result: MemoryQueryResult, ttl: number): Result<void> {
    return Result.try(() => {
      const entry: QueryCacheEntry = {
        key,
        result,
        createdAt: new Date(),
        ttl: Math.max(0, ttl),
        hits: 0,
      };

      this.cache.set(key, entry);
    });
  }

  delete(key: string): Result<void> {
    return Result.try(() => {
      this.cache.delete(key);
    });
  }

  clear(): Result<void> {
    return Result.try(() => {
      this.cache.clear();
      this.hits = 0;
      this.misses = 0;
    });
  }

  getStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
    };
  }
}
