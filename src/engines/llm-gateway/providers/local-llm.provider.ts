import { BaseLLMProvider, LLMProviderTransport } from './base-llm-provider';
import { LLMProviderConfig } from '../dtos/llm-gateway.dtos';
import { LLMProviderType } from '../enums/llm-gateway.enums';

export class LocalLLMProvider extends BaseLLMProvider {
  readonly type = LLMProviderType.LOCAL;

  constructor(config: LLMProviderConfig, transport: LLMProviderTransport) {
    super(config, transport);
  }

  override estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4.0);
  }
}
