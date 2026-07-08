import { ILLMProvider } from '../interfaces/llm-provider.interface';
import { OpenAIProvider } from '../providers/openai.provider';
import { ClaudeProvider } from '../providers/claude.provider';
import { GeminiProvider } from '../providers/gemini.provider';
import { LocalLLMProvider } from '../providers/local-llm.provider';
import { LLMProviderTransport } from '../providers/base-llm-provider';
import { LLMProviderConfig } from '../dtos/llm-gateway.dtos';
import { LLMProviderType } from '../enums/llm-gateway.enums';

/**
 * Constructs concrete provider instances. Transports are injected so tests can
 * substitute in-process transports and production can wire real HTTP clients
 * without changing the gateway.
 */
export class LLMProviderFactory {
  create(config: LLMProviderConfig, transport: LLMProviderTransport): ILLMProvider {
    switch (config.type) {
      case LLMProviderType.OPENAI:
        return new OpenAIProvider(config, transport);
      case LLMProviderType.CLAUDE:
        return new ClaudeProvider(config, transport);
      case LLMProviderType.GEMINI:
        return new GeminiProvider(config, transport);
      case LLMProviderType.LOCAL:
        return new LocalLLMProvider(config, transport);
      default:
        throw new Error(`Unknown LLM provider type: ${config.type}`);
    }
  }
}
