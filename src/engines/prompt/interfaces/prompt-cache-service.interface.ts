import { IResult } from '@services/types/result.type';
import { PromptPayload } from '../dtos/prompt.dtos';

export interface IPromptCacheService {
  /**
   * Retrieve cached prompt if exists and not expired.
   */
  get(key: string): Promise<IResult<PromptPayload | null>>;

  /**
   * Store prompt in cache.
   */
  set(key: string, prompt: PromptPayload, ttlSeconds: number): Promise<IResult<void>>;

  /**
   * Clear cache entry.
   */
  invalidate(key: string): Promise<IResult<void>>;

  /**
   * Get cache statistics.
   */
  getStats(): Promise<IResult<{ hits: number; misses: number; size: number }>>;
}
