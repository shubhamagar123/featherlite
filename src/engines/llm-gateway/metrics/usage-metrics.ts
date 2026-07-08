import { LLMProviderType } from '../enums/llm-gateway.enums';
import { LLMResponse, LLMUsageSnapshot } from '../dtos/llm-gateway.dtos';

interface ProviderAccumulator {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUsd: number;
  totalLatencyMs: number;
  errorCount: number;
  windowStart: Date;
}

/**
 * Records aggregate usage per provider. Provides snapshots for observability
 * and downstream billing. Thread safety is not required here because the
 * gateway is single-process; sharding across processes is a downstream concern.
 */
export class UsageMetrics {
  private accumulators: Map<LLMProviderType, ProviderAccumulator> = new Map();

  recordSuccess(response: LLMResponse): void {
    const acc = this.getOrCreate(response.provider);
    acc.totalRequests++;
    acc.totalPromptTokens += response.usage.promptTokens;
    acc.totalCompletionTokens += response.usage.completionTokens;
    acc.totalCostUsd += response.cost.totalCostUsd;
    acc.totalLatencyMs += response.latencyMs;
  }

  recordFailure(provider: LLMProviderType): void {
    const acc = this.getOrCreate(provider);
    acc.totalRequests++;
    acc.errorCount++;
  }

  getSnapshot(provider?: LLMProviderType): LLMUsageSnapshot[] {
    const now = new Date();
    const providers = provider
      ? [provider].filter((p) => this.accumulators.has(p))
      : Array.from(this.accumulators.keys());

    return providers.map((p) => {
      const acc = this.accumulators.get(p)!;
      const averageLatencyMs =
        acc.totalRequests > 0 ? acc.totalLatencyMs / acc.totalRequests : 0;
      return {
        provider: p,
        totalRequests: acc.totalRequests,
        totalPromptTokens: acc.totalPromptTokens,
        totalCompletionTokens: acc.totalCompletionTokens,
        totalCostUsd: acc.totalCostUsd,
        averageLatencyMs,
        errorCount: acc.errorCount,
        windowStart: acc.windowStart,
        windowEnd: now,
      };
    });
  }

  reset(): void {
    this.accumulators.clear();
  }

  private getOrCreate(provider: LLMProviderType): ProviderAccumulator {
    let acc = this.accumulators.get(provider);
    if (!acc) {
      acc = {
        totalRequests: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalCostUsd: 0,
        totalLatencyMs: 0,
        errorCount: 0,
        windowStart: new Date(),
      };
      this.accumulators.set(provider, acc);
    }
    return acc;
  }
}
