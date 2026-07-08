import { ILLMProvider } from '../interfaces/llm-provider.interface';
import { LLMProviderType } from '../enums/llm-gateway.enums';

export class FallbackStrategy {
  nextProvider(
    currentType: LLMProviderType,
    triedProviders: Set<LLMProviderType>,
    providers: ILLMProvider[]
  ): ILLMProvider | null {
    const current = providers.find((p) => p.type === currentType);
    if (!current) return null;

    for (const fallbackType of current.config.fallbackProviders) {
      if (triedProviders.has(fallbackType)) continue;
      const provider = providers.find((p) => p.type === fallbackType);
      if (provider && provider.isAvailable()) return provider;
    }

    for (const provider of providers) {
      if (triedProviders.has(provider.type)) continue;
      if (provider.type === currentType) continue;
      if (provider.isAvailable()) return provider;
    }

    return null;
  }
}
