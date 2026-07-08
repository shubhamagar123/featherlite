import { BaseLLMProvider, LLMProviderTransport } from './base-llm-provider';
import { LLMProviderConfig } from '../dtos/llm-gateway.dtos';
import { LLMProviderType } from '../enums/llm-gateway.enums';

export class OpenAIProvider extends BaseLLMProvider {
  readonly type = LLMProviderType.OPENAI;

  constructor(config: LLMProviderConfig, transport: LLMProviderTransport) {
    super(config, transport);
  }

  override estimateTokens(text: string): number {
    if (!text) return 0;
    // GPT tokenizer averages ~3.6 chars/token for English prose.
    return Math.ceil(text.length / 3.6);
  }
}
