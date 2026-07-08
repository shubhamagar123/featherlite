import { IResult } from '@services/types/result.type';
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMProviderHealth,
  LLMProviderConfig,
} from '../dtos/llm-gateway.dtos';
import { LLMProviderType } from '../enums/llm-gateway.enums';

export interface ILLMProvider {
  readonly type: LLMProviderType;
  readonly config: LLMProviderConfig;

  complete(request: LLMRequest): Promise<IResult<LLMResponse>>;
  stream(request: LLMRequest): AsyncIterable<LLMStreamChunk>;
  healthCheck(): Promise<IResult<LLMProviderHealth>>;
  estimateTokens(text: string): number;
  isAvailable(): boolean;
}
