import {
  getLLMGateway,
  resetLLMGateway,
  DEFAULT_PROVIDER_CONFIGS,
  LLMProviderType,
  LLMRequestMode,
  LLMSelectionStrategy,
  LLMFinishReason,
  LLMResponseStatus,
} from '../index';
import { LLMProviderTransport } from '../providers/base-llm-provider';
import { LLMProviderFactory } from '../factories/provider.factory';
import { LLMRequest } from '../dtos/llm-gateway.dtos';

function makeTransport(
  behavior: Partial<{
    content: string;
    promptTokens: number;
    completionTokens: number;
    fail: boolean;
    failTimes: number;
    delayMs: number;
  }> = {}
): LLMProviderTransport {
  let calls = 0;
  return {
    async invoke() {
      calls++;
      if (behavior.delayMs) {
        await new Promise((r) => setTimeout(r, behavior.delayMs));
      }
      if (behavior.fail && (!behavior.failTimes || calls <= behavior.failTimes)) {
        throw new Error('simulated failure');
      }
      return {
        content: behavior.content ?? 'ok',
        finishReason: LLMFinishReason.STOP,
        promptTokens: behavior.promptTokens ?? 10,
        completionTokens: behavior.completionTokens ?? 5,
        model: 'test-model',
      };
    },
    async *invokeStream() {
      yield { delta: behavior.content ?? 'ok', finished: true, finishReason: LLMFinishReason.STOP };
    },
  };
}

function makeRequest(overrides: Partial<LLMRequest> = {}): LLMRequest {
  return {
    requestId: 'req_1',
    messages: [{ role: 'user', content: 'hello' }],
    mode: LLMRequestMode.COMPLETION,
    ...overrides,
  };
}

describe('LLMGateway', () => {
  beforeEach(() => {
    resetLLMGateway();
  });

  it('completes a request through the highest-priority provider', async () => {
    const factory = new LLMProviderFactory();
    const providers = DEFAULT_PROVIDER_CONFIGS
      .filter((c) => c.enabled)
      .map((c) => factory.create(c, makeTransport({ content: c.type })));

    const gateway = getLLMGateway({ providers, retryPolicy: {
      maxAttempts: 1, initialDelayMs: 1, maxDelayMs: 1, backoffMultiplier: 1, jitter: false
    } });

    const result = await gateway.complete(makeRequest());
    expect(result.isSuccess).toBe(true);
    expect(result.value?.status).toBe(LLMResponseStatus.SUCCESS);
    expect(result.value?.provider).toBe(LLMProviderType.OPENAI);
    expect(result.value?.usage.totalTokens).toBe(15);
  });

  it('caches identical requests and returns cached=true on second call', async () => {
    const factory = new LLMProviderFactory();
    const providers = [
      factory.create(DEFAULT_PROVIDER_CONFIGS[0], makeTransport({ content: 'cached' })),
    ];
    const gateway = getLLMGateway({ providers });

    const req = makeRequest({ cacheKey: 'k', cacheTtlMs: 60_000 });
    const first = await gateway.complete(req);
    const second = await gateway.complete(req);

    expect(first.value?.cached).toBe(false);
    expect(second.value?.cached).toBe(true);
    expect(second.value?.content).toBe('cached');
  });

  it('falls back to another provider on repeated failure', async () => {
    const factory = new LLMProviderFactory();
    const openai = factory.create(
      DEFAULT_PROVIDER_CONFIGS[0],
      makeTransport({ fail: true })
    );
    const claude = factory.create(
      DEFAULT_PROVIDER_CONFIGS[1],
      makeTransport({ content: 'from-claude' })
    );
    const gateway = getLLMGateway({
      providers: [openai, claude],
      retryPolicy: { maxAttempts: 2, initialDelayMs: 1, maxDelayMs: 2, backoffMultiplier: 1, jitter: false },
    });

    const result = await gateway.complete(makeRequest());
    expect(result.isSuccess).toBe(true);
    expect(result.value?.provider).toBe(LLMProviderType.CLAUDE);
    expect(result.value?.fallbacksUsed).toContain(LLMProviderType.CLAUDE);
  });

  it('retries transient failures within a single provider', async () => {
    const factory = new LLMProviderFactory();
    const openai = factory.create(
      DEFAULT_PROVIDER_CONFIGS[0],
      makeTransport({ fail: true, failTimes: 1, content: 'succeeded' })
    );
    const gateway = getLLMGateway({
      providers: [openai],
      retryPolicy: { maxAttempts: 3, initialDelayMs: 1, maxDelayMs: 2, backoffMultiplier: 1, jitter: false },
    });

    const result = await gateway.complete(makeRequest());
    expect(result.isSuccess).toBe(true);
    expect(result.value?.attempt).toBeGreaterThanOrEqual(2);
  });

  it('reports failure when all providers exhaust', async () => {
    const factory = new LLMProviderFactory();
    const openai = factory.create(
      DEFAULT_PROVIDER_CONFIGS[0],
      makeTransport({ fail: true })
    );
    const gateway = getLLMGateway({
      providers: [openai],
      retryPolicy: { maxAttempts: 2, initialDelayMs: 1, maxDelayMs: 2, backoffMultiplier: 1, jitter: false },
    });

    const result = await gateway.complete(makeRequest());
    expect(result.isSuccess).toBe(false);
  });

  it('respects preferredProvider in selectProvider', async () => {
    const factory = new LLMProviderFactory();
    const providers = DEFAULT_PROVIDER_CONFIGS
      .filter((c) => c.enabled)
      .map((c) => factory.create(c, makeTransport()));

    const gateway = getLLMGateway({ providers });
    const sel = gateway.selectProvider({
      strategy: LLMSelectionStrategy.PRIMARY_WITH_FALLBACK,
      preferredProvider: LLMProviderType.CLAUDE,
    });
    expect(sel.value).toBe(LLMProviderType.CLAUDE);
  });

  it('selects lowest-cost provider under LOWEST_COST strategy', async () => {
    const factory = new LLMProviderFactory();
    const providers = DEFAULT_PROVIDER_CONFIGS
      .filter((c) => c.enabled)
      .map((c) => factory.create(c, makeTransport()));

    const gateway = getLLMGateway({ providers });
    const sel = gateway.selectProvider({ strategy: LLMSelectionStrategy.LOWEST_COST });
    expect(sel.value).toBe(LLMProviderType.GEMINI);
  });

  it('computes cost correctly per provider config', async () => {
    const factory = new LLMProviderFactory();
    const openai = factory.create(
      DEFAULT_PROVIDER_CONFIGS[0],
      makeTransport({ promptTokens: 1_000_000, completionTokens: 1_000_000 })
    );
    const gateway = getLLMGateway({
      providers: [openai],
      retryPolicy: { maxAttempts: 1, initialDelayMs: 1, maxDelayMs: 1, backoffMultiplier: 1, jitter: false },
    });

    const result = await gateway.complete(makeRequest());
    expect(result.value?.cost.promptCostUsd).toBeCloseTo(0.15, 5);
    expect(result.value?.cost.completionCostUsd).toBeCloseTo(0.6, 5);
    expect(result.value?.cost.totalCostUsd).toBeCloseTo(0.75, 5);
  });

  it('reports usage metrics after a call', async () => {
    const factory = new LLMProviderFactory();
    const openai = factory.create(
      DEFAULT_PROVIDER_CONFIGS[0],
      makeTransport({ promptTokens: 100, completionTokens: 50 })
    );
    const gateway = getLLMGateway({
      providers: [openai],
      retryPolicy: { maxAttempts: 1, initialDelayMs: 1, maxDelayMs: 1, backoffMultiplier: 1, jitter: false },
    });

    await gateway.complete(makeRequest());
    const usage = gateway.getUsage();
    expect(usage.value?.length).toBe(1);
    expect(usage.value?.[0].totalRequests).toBe(1);
    expect(usage.value?.[0].totalPromptTokens).toBe(100);
  });

  it('returns health for all registered providers', async () => {
    const factory = new LLMProviderFactory();
    const providers = DEFAULT_PROVIDER_CONFIGS
      .filter((c) => c.enabled)
      .map((c) => factory.create(c, makeTransport()));

    const gateway = getLLMGateway({ providers });
    const health = await gateway.getHealth();
    expect(health.value?.length).toBe(providers.length);
  });

  it('streams chunks from the selected provider', async () => {
    const factory = new LLMProviderFactory();
    const openai = factory.create(
      DEFAULT_PROVIDER_CONFIGS[0],
      makeTransport({ content: 'hello streaming' })
    );
    const gateway = getLLMGateway({ providers: [openai] });

    const chunks: string[] = [];
    for await (const chunk of gateway.stream(makeRequest({ mode: LLMRequestMode.STREAMING }))) {
      chunks.push(chunk.delta);
    }
    expect(chunks.join('')).toBe('hello streaming');
  });

  it('times out slow providers', async () => {
    const factory = new LLMProviderFactory();
    const openai = factory.create(
      { ...DEFAULT_PROVIDER_CONFIGS[0], timeoutMs: 20 },
      makeTransport({ delayMs: 200, content: 'ok' })
    );
    const gateway = getLLMGateway({
      providers: [openai],
      retryPolicy: { maxAttempts: 1, initialDelayMs: 1, maxDelayMs: 1, backoffMultiplier: 1, jitter: false },
    });

    const result = await gateway.complete(makeRequest());
    expect(result.isSuccess).toBe(false);
    // With no fallback provider available and no retries, the gateway reports
    // provider exhaustion. The underlying provider health should show failure.
    expect(result.error?.message.toLowerCase()).toContain('exhausted');
  });
});
