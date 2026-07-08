import { ILLMGateway } from './interfaces/llm-gateway.interface';
import { ILLMProvider } from './interfaces/llm-provider.interface';
import { LLMGateway } from './llm-gateway';
import { LLMCacheService } from './cache/llm-cache.service';
import { LLMProviderFactory } from './factories/provider.factory';
import { LLMProviderTransport } from './providers/base-llm-provider';
import { LLMProviderConfig, LLMRetryPolicy } from './dtos/llm-gateway.dtos';
import { LLMProviderType, LLMFinishReason } from './enums/llm-gateway.enums';
import { EventEngine, getEventEngine } from '@engines/event';

export interface LLMGatewayDepsOverride {
  providers?: ILLMProvider[];
  providerConfigs?: LLMProviderConfig[];
  transportFactory?: (type: LLMProviderType) => LLMProviderTransport;
  eventEngine?: EventEngine;
  retryPolicy?: LLMRetryPolicy;
}

let cached: ILLMGateway | null = null;

const DEFAULT_PROVIDER_CONFIGS: LLMProviderConfig[] = [
  {
    type: LLMProviderType.OPENAI,
    model: 'gpt-4o-mini',
    enabled: true,
    priority: 1,
    timeoutMs: 30_000,
    retryAttempts: 3,
    fallbackProviders: [LLMProviderType.CLAUDE, LLMProviderType.GEMINI],
    pricing: { promptCostPerMillion: 0.15, completionCostPerMillion: 0.6 },
    rateLimit: { requestsPerMinute: 500, tokensPerMinute: 200_000 },
  },
  {
    type: LLMProviderType.CLAUDE,
    model: 'claude-haiku-4-5',
    enabled: true,
    priority: 2,
    timeoutMs: 30_000,
    retryAttempts: 3,
    fallbackProviders: [LLMProviderType.OPENAI, LLMProviderType.GEMINI],
    pricing: { promptCostPerMillion: 1.0, completionCostPerMillion: 5.0 },
    rateLimit: { requestsPerMinute: 500, tokensPerMinute: 200_000 },
  },
  {
    type: LLMProviderType.GEMINI,
    model: 'gemini-1.5-flash',
    enabled: true,
    priority: 3,
    timeoutMs: 30_000,
    retryAttempts: 3,
    fallbackProviders: [LLMProviderType.OPENAI, LLMProviderType.CLAUDE],
    pricing: { promptCostPerMillion: 0.075, completionCostPerMillion: 0.3 },
    rateLimit: { requestsPerMinute: 500, tokensPerMinute: 200_000 },
  },
  {
    type: LLMProviderType.LOCAL,
    model: 'local-default',
    enabled: false,
    priority: 4,
    timeoutMs: 60_000,
    retryAttempts: 2,
    fallbackProviders: [LLMProviderType.OPENAI],
    pricing: { promptCostPerMillion: 0, completionCostPerMillion: 0 },
    rateLimit: { requestsPerMinute: 10_000, tokensPerMinute: 5_000_000 },
  },
];

/**
 * Default transport factory used when the caller does not provide one.
 * Production callers wire real HTTP transports; test callers substitute stubs.
 * The default transport surfaces its unconfigured state explicitly so mis-wiring
 * fails fast instead of silently returning empty completions.
 */
function makeUnconfiguredTransport(type: LLMProviderType): LLMProviderTransport {
  return {
    async invoke() {
      throw new Error(
        `LLM provider ${type} is not configured with a transport. Wire an HTTP transport via getLLMGateway({ transportFactory }).`
      );
    },
    async *invokeStream() {
      yield { delta: '', finished: true, finishReason: LLMFinishReason.ERROR };
      throw new Error(
        `LLM provider ${type} streaming is not configured with a transport.`
      );
    },
  };
}

export function getLLMGateway(deps: LLMGatewayDepsOverride = {}): ILLMGateway {
  if (cached && !hasOverrides(deps)) return cached;

  const factory = new LLMProviderFactory();
  const configs = deps.providerConfigs ?? DEFAULT_PROVIDER_CONFIGS;
  const transportFactory = deps.transportFactory ?? makeUnconfiguredTransport;

  const providers =
    deps.providers ??
    configs
      .filter((c) => c.enabled)
      .map((c) => factory.create(c, transportFactory(c.type)));

  const gateway = new LLMGateway({
    providers,
    cache: new LLMCacheService(),
    eventEngine: deps.eventEngine ?? getEventEngine(),
    retryPolicy: deps.retryPolicy,
  });

  if (!hasOverrides(deps)) cached = gateway;
  return gateway;
}

export function resetLLMGateway(): void {
  cached = null;
}

function hasOverrides(deps: LLMGatewayDepsOverride): boolean {
  return Boolean(
    deps.providers ||
      deps.providerConfigs ||
      deps.transportFactory ||
      deps.eventEngine ||
      deps.retryPolicy
  );
}

export { DEFAULT_PROVIDER_CONFIGS };
