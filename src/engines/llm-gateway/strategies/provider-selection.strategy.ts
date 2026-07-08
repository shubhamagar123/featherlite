import { IResult, Result } from '@services/types/result.type';
import { ILLMProvider } from '../interfaces/llm-provider.interface';
import { LLMSelectionCriteria } from '../dtos/llm-gateway.dtos';
import { LLMProviderType, LLMSelectionStrategy } from '../enums/llm-gateway.enums';

/**
 * Deterministically selects a provider for a request. Strategy input is
 * combined with observed latency, cost, and health to pick the right provider.
 */
export class ProviderSelectionStrategy {
  private roundRobinCursor: number = 0;

  select(
    providers: ILLMProvider[],
    criteria: LLMSelectionCriteria
  ): IResult<LLMProviderType> {
    const eligible = providers.filter((p) => {
      if (!p.isAvailable()) return false;
      if (criteria.excludeProviders?.includes(p.type)) return false;
      return true;
    });

    if (eligible.length === 0) {
      return Result.failure(new Error('No eligible LLM providers available'));
    }

    if (criteria.preferredProvider) {
      const preferred = eligible.find((p) => p.type === criteria.preferredProvider);
      if (preferred) {
        return Result.success(preferred.type);
      }
    }

    switch (criteria.strategy) {
      case LLMSelectionStrategy.ROUND_ROBIN: {
        const provider = eligible[this.roundRobinCursor % eligible.length];
        this.roundRobinCursor = (this.roundRobinCursor + 1) % eligible.length;
        return Result.success(provider.type);
      }

      case LLMSelectionStrategy.LOWEST_COST: {
        const sorted = [...eligible].sort((a, b) => {
          const costA =
            a.config.pricing.promptCostPerMillion + a.config.pricing.completionCostPerMillion;
          const costB =
            b.config.pricing.promptCostPerMillion + b.config.pricing.completionCostPerMillion;
          return costA - costB;
        });
        return Result.success(sorted[0].type);
      }

      case LLMSelectionStrategy.LOWEST_LATENCY: {
        const sorted = [...eligible].sort((a, b) => a.config.timeoutMs - b.config.timeoutMs);
        return Result.success(sorted[0].type);
      }

      case LLMSelectionStrategy.BEST_QUALITY: {
        // Priority is the operator-set quality rank (lower number = higher quality).
        const sorted = [...eligible].sort((a, b) => a.config.priority - b.config.priority);
        return Result.success(sorted[0].type);
      }

      case LLMSelectionStrategy.PRIMARY_WITH_FALLBACK:
      default: {
        const sorted = [...eligible].sort((a, b) => a.config.priority - b.config.priority);
        return Result.success(sorted[0].type);
      }
    }
  }

  fallbackChain(primary: ILLMProvider, providers: ILLMProvider[]): LLMProviderType[] {
    const chain: LLMProviderType[] = [];
    for (const fallbackType of primary.config.fallbackProviders) {
      const fp = providers.find((p) => p.type === fallbackType && p.isAvailable());
      if (fp) chain.push(fp.type);
    }
    // Ensure any remaining eligible provider is appended as a last resort.
    for (const p of providers) {
      if (p.type === primary.type) continue;
      if (chain.includes(p.type)) continue;
      if (p.isAvailable()) chain.push(p.type);
    }
    return chain;
  }
}
