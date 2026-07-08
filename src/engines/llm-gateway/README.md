# LLM Gateway

The single boundary between Featherlight and any AI provider. No engine or service is permitted to call an LLM provider directly — everything goes through this gateway.

## Responsibilities

- Provider abstraction (OpenAI, Claude, Gemini, Local)
- Streaming and completion modes
- Retries with backoff + jitter
- Provider fallback chains
- Timeouts per request/provider
- Cost, token, and usage metrics
- Health checks
- Provider selection strategies (ROUND_ROBIN, LOWEST_COST, LOWEST_LATENCY, BEST_QUALITY, PRIMARY_WITH_FALLBACK)
- In-memory response caching
- Domain event emission (`LLM_RESPONSE_GENERATED`)

## Public API

```ts
import { getLLMGateway, LLMRequestMode } from '@engines/llm-gateway';

const gateway = getLLMGateway();

const result = await gateway.complete({
  requestId: 'req_1',
  messages: [{ role: 'user', content: 'Hello' }],
  mode: LLMRequestMode.COMPLETION,
});
```

## Wiring real providers

The default factory registers unconfigured transports so mis-wiring fails fast.
Wire real providers with a transport factory:

```ts
getLLMGateway({
  transportFactory: (type) => ({
    async invoke(request, config) { /* real HTTP call */ },
    async *invokeStream(request, config) { /* real streaming */ },
  }),
});
```

## Architecture

```
LLMGateway
├── ProviderSelectionStrategy   — chooses a provider per request
├── RetryStrategy               — backoff schedule + retry guard
├── FallbackStrategy            — traverses provider fallback chain
├── LLMCacheService             — TTL response cache
├── UsageMetrics                — per-provider counters + cost accum
├── HealthChecker               — status snapshots
└── Providers[]
    └── BaseLLMProvider
        ├── OpenAIProvider
        ├── ClaudeProvider
        ├── GeminiProvider
        └── LocalLLMProvider
```
