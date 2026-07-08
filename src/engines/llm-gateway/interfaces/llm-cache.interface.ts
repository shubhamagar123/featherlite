import { IResult } from '@services/types/result.type';
import { LLMResponse } from '../dtos/llm-gateway.dtos';

export interface ILLMCache {
  get(key: string): IResult<LLMResponse | null>;
  set(key: string, response: LLMResponse, ttlMs: number): IResult<void>;
  invalidate(key: string): IResult<void>;
  clear(): IResult<void>;
  getStats(): { size: number; hits: number; misses: number };
}
