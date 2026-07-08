import { IResult } from '@services/types/result.type';
import { PromptPackage, CacheEntry } from '../dtos/prompt.dtos';

export interface IPromptCache {
  /**
   * Retrieve cached prompt if exists and not expired.
   */
  get(key: string): Promise<IResult<PromptPackage | null>>;

  /**
   * Store prompt in cache.
   */
  set(key: string, prompt: PromptPackage, ttlSeconds: number): Promise<IResult<void>>;

  /**
   * Clear cache entry.
   */
  invalidate(key: string): Promise<IResult<void>>;

  /**
   * Get cache statistics.
   */
  getStats(): Promise<IResult<{ hits: number; misses: number; size: number }>>;
}
