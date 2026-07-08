import { IResult } from '@services/types/result.type';
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMProviderHealth,
  LLMUsageSnapshot,
  LLMSelectionCriteria,
} from '../dtos/llm-gateway.dtos';
import { LLMProviderType } from '../enums/llm-gateway.enums';

export interface ILLMGateway {
  complete(request: LLMRequest): Promise<IResult<LLMResponse>>;
  stream(request: LLMRequest): AsyncIterable<LLMStreamChunk>;
  selectProvider(criteria: LLMSelectionCriteria): IResult<LLMProviderType>;
  getHealth(provider?: LLMProviderType): Promise<IResult<LLMProviderHealth[]>>;
  getUsage(provider?: LLMProviderType): IResult<LLMUsageSnapshot[]>;
  registerProvider(providerType: LLMProviderType): IResult<void>;
  resetMetrics(): void;
}
