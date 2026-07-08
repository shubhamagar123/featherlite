import { BaseLLMProvider, LLMProviderTransport } from './base-llm-provider';
import { LLMProviderConfig } from '../dtos/llm-gateway.dtos';
import { LLMProviderType } from '../enums/llm-gateway.enums';

export class GeminiProvider extends BaseLLMProvider {
  readonly type = LLMProviderType.GEMINI;

  constructor(config: LLMProviderConfig, transport: LLMProviderTransport) {
    super(config, transport);
  }

  override estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4.0);
  }
}
