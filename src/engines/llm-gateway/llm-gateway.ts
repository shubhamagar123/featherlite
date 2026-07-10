import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { ILLMGateway } from './interfaces/llm-gateway.interface';
import { ILLMProvider } from './interfaces/llm-provider.interface';
import { ILLMCache } from './interfaces/llm-cache.interface';
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMSelectionCriteria,
  LLMProviderHealth,
  LLMUsageSnapshot,
  LLMRetryPolicy,
  LLMRequestPriority,
} from './dtos/llm-gateway.dtos';
import {
  LLMProviderType,
  LLMResponseStatus,
  LLMSelectionStrategy,
  LLMFinishReason,
} from './enums/llm-gateway.enums';
import { ProviderSelectionStrategy } from './strategies/provider-selection.strategy';
import { RetryStrategy } from './strategies/retry.strategy';
import { FallbackStrategy } from './strategies/fallback.strategy';
import { UsageMetrics } from './metrics/usage-metrics';
import { HealthChecker } from './health/health-checker';
import { EventEngine } from '@engines/event';
import { EventType, AggregateType, EventPriority, EventDispatchMode } from '@engines/event';
import { EventFactory } from '@engines/event';
import { PromptSanitizer } from './utils/prompt-sanitizer';

export interface LLMGatewayDeps {
  providers: ILLMProvider[];
  cache: ILLMCache;
  eventEngine?: EventEngine;
  retryPolicy?: LLMRetryPolicy;
  selectionStrategy?: ProviderSelectionStrategy;
  healthChecker?: HealthChecker;
  usageMetrics?: UsageMetrics;
}

const DEFAULT_RETRY_POLICY: LLMRetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 200,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  jitter: true,
};

export class LLMGateway implements ILLMGateway {
  private readonly logger: Logger;
  private readonly providers: Map<LLMProviderType, ILLMProvider>;
  private readonly cache: ILLMCache;
  private readonly eventEngine?: EventEngine;
  private readonly retry: RetryStrategy;
  private readonly selection: ProviderSelectionStrategy;
  private readonly fallback: FallbackStrategy;
  private readonly usage: UsageMetrics;
  private readonly health: HealthChecker;

  constructor(deps: LLMGatewayDeps) {
    this.logger = createLogger('LLMGateway');
    this.providers = new Map(deps.providers.map((p) => [p.type, p]));
    this.cache = deps.cache;
    this.eventEngine = deps.eventEngine;
    this.retry = new RetryStrategy(deps.retryPolicy ?? DEFAULT_RETRY_POLICY);
    this.selection = deps.selectionStrategy ?? new ProviderSelectionStrategy();
    this.fallback = new FallbackStrategy();
    this.usage = deps.usageMetrics ?? new UsageMetrics();
    this.health = deps.healthChecker ?? new HealthChecker();
  }

  async complete(request: LLMRequest): Promise<IResult<LLMResponse>> {
    // Sanitize messages to prevent prompt injection attacks
    let sanitizedRequest = {
      ...request,
      messages: PromptSanitizer.sanitizeMessages(request.messages),
    };

    // Tier 2A: Optimize max_tokens based on priority
    sanitizedRequest = this.optimizeMaxTokens(sanitizedRequest);

    const namespacedCacheKey = this.getNamespacedCacheKey(sanitizedRequest.userId, sanitizedRequest.cacheKey);
    if (namespacedCacheKey) {
      const cached = this.cache.get(namespacedCacheKey);
      if (cached.isSuccess && cached.value) {
        this.logger.debug({ requestId: sanitizedRequest.requestId, cacheKey: namespacedCacheKey }, 'LLM cache hit');
        return Result.success({ ...cached.value, cached: true });
      }
    }

    // Intelligent provider routing based on request priority (Tier 1A)
    const strategy = this.getSelectionStrategy(sanitizedRequest.priority);
    const selection = this.selectProvider({
      strategy,
      preferredProvider: sanitizedRequest.provider,
    });
    if (!selection.isSuccess || !selection.value) {
      return Result.failure(selection.error ?? new Error('No provider available'));
    }

    const initialProvider = this.providers.get(selection.value)!;
    const result = await this.executeWithRetryAndFallback(sanitizedRequest, initialProvider);

    if (result.isSuccess && result.value) {
      this.usage.recordSuccess(result.value);
      if (namespacedCacheKey && request.cacheTtlMs && request.cacheTtlMs > 0) {
        this.cache.set(namespacedCacheKey, result.value, request.cacheTtlMs);
      }
      await this.publishResponseEvent(request, result.value);
    } else {
      this.usage.recordFailure(initialProvider.type);
    }

    return result;
  }

  async *stream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    // Tier 2A: Optimize max_tokens based on priority
    const optimizedRequest = this.optimizeMaxTokens(request);

    // Intelligent provider routing based on request priority (Tier 1A)
    const strategy = this.getSelectionStrategy(optimizedRequest.priority);
    const selection = this.selectProvider({
      strategy,
      preferredProvider: optimizedRequest.provider,
    });
    if (!selection.isSuccess || !selection.value) {
      throw selection.error ?? new Error('No provider available');
    }
    const provider = this.providers.get(selection.value)!;
    const startTime = Date.now();
    let accumulatedContent = '';
    let totalTokens = 0;

    for await (const chunk of provider.stream(optimizedRequest)) {
      accumulatedContent += chunk.delta;
      yield chunk;

      if (chunk.finished) {
        // Emit terminal event when stream completes
        const response: LLMResponse = {
          requestId: optimizedRequest.requestId,
          provider: chunk.provider,
          model: chunk.model,
          status: LLMResponseStatus.SUCCESS,
          content: accumulatedContent,
          finishReason: chunk.finishReason ?? LLMFinishReason.STOP,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens,
          },
          cost: {
            promptCostUsd: 0,
            completionCostUsd: 0,
            totalCostUsd: 0,
          },
          latencyMs: Date.now() - startTime,
          cached: false,
          attempt: 1,
          fallbacksUsed: [],
          createdAt: new Date(),
        };
        await this.publishResponseEvent(optimizedRequest, response);
      }
    }
  }

  /**
   * Tier 1A: Intelligent Model Routing
   * Determines provider selection strategy based on request priority.
   * CRITICAL: High-quality models (Claude)
   * HIGH: Balanced models (Claude with Gemini fallback)
   * STANDARD: Cost-optimized models (Gemini with OpenAI fallback)
   */
  private getSelectionStrategy(priority?: LLMRequestPriority): LLMSelectionStrategy {
    switch (priority) {
      case LLMRequestPriority.CRITICAL:
        // Real-time user interactions: prioritize quality/latency
        return LLMSelectionStrategy.BEST_QUALITY;
      case LLMRequestPriority.HIGH:
        // Important but non-real-time: balanced approach
        return LLMSelectionStrategy.PRIMARY_WITH_FALLBACK;
      case LLMRequestPriority.STANDARD:
      default:
        // Batch/evaluation: prioritize cost (Gemini first)
        return LLMSelectionStrategy.LOWEST_COST;
    }
  }

  /**
   * Tier 2A: Max Token Allocation Optimization
   * Reduces completion token allocation based on request priority and type.
   * CRITICAL: 256 tokens (real-time responses typically 80-150 tokens)
   * HIGH: 300 tokens (structured judgments ~150-250 tokens)
   * STANDARD: 150 tokens (simple evaluations/judgments ~50-120 tokens)
   */
  private optimizeMaxTokens(request: LLMRequest): LLMRequest {
    if (request.maxTokens !== undefined) {
      return request; // Respect explicit max_tokens
    }

    const priority = request.priority ?? LLMRequestPriority.STANDARD;
    const optimizedMaxTokens = this.getOptimizedMaxTokens(priority);

    return {
      ...request,
      maxTokens: optimizedMaxTokens,
    };
  }

  private getOptimizedMaxTokens(priority: LLMRequestPriority): number {
    switch (priority) {
      case LLMRequestPriority.CRITICAL:
        return 256; // Conversation responses: ~80-150 tokens average
      case LLMRequestPriority.HIGH:
        return 300; // Structured responses: ~150-250 tokens average
      case LLMRequestPriority.STANDARD:
      default:
        return 150; // Evaluation responses: ~50-120 tokens average
    }
  }

  selectProvider(criteria: LLMSelectionCriteria): IResult<LLMProviderType> {
    return this.selection.select(Array.from(this.providers.values()), criteria);
  }

  async getHealth(provider?: LLMProviderType): Promise<IResult<LLMProviderHealth[]>> {
    if (provider) {
      return this.health.check(provider, Array.from(this.providers.values()));
    }
    return this.health.checkAll(Array.from(this.providers.values()));
  }

  getUsage(provider?: LLMProviderType): IResult<LLMUsageSnapshot[]> {
    return Result.success(this.usage.getSnapshot(provider));
  }

  registerProvider(providerType: LLMProviderType): IResult<void> {
    if (!this.providers.has(providerType)) {
      return Result.failure(new Error(`Provider ${providerType} is not registered`));
    }
    return Result.success(undefined);
  }

  resetMetrics(): void {
    this.usage.reset();
    this.cache.clear();
  }

  private getNamespacedCacheKey(userId: string | undefined, cacheKey: string | undefined): string | undefined {
    if (!cacheKey) {
      return undefined;
    }
    if (!userId) {
      return cacheKey;
    }
    return `${userId}:${cacheKey}`;
  }

  private async executeWithRetryAndFallback(
    request: LLMRequest,
    initialProvider: ILLMProvider
  ): Promise<IResult<LLMResponse>> {
    const fallbacksUsed: LLMProviderType[] = [];
    const tried = new Set<LLMProviderType>();
    let currentProvider: ILLMProvider | null = initialProvider;

    while (currentProvider) {
      tried.add(currentProvider.type);
      let attempt = 1;
      const maxAttempts = this.retry.getMaxAttempts();

      while (attempt <= maxAttempts) {
        const response = await currentProvider.complete(request);

        if (response.isSuccess && response.value) {
          const augmented: LLMResponse = {
            ...response.value,
            attempt,
            fallbacksUsed,
          };
          return Result.success(augmented);
        }

        const error = response.error ?? new Error('Provider returned no response');
        if (!this.retry.shouldRetry(attempt, error)) break;

        const delay = this.retry.computeDelay(attempt);
        this.logger.warn(
          {
            provider: currentProvider.type,
            attempt,
            delay,
            requestId: request.requestId,
          },
          'Retrying LLM request'
        );
        await this.retry.wait(delay);
        attempt++;
      }

      const next = this.fallback.nextProvider(
        currentProvider.type,
        tried,
        Array.from(this.providers.values())
      );
      if (!next) break;
      fallbacksUsed.push(next.type);
      currentProvider = next;
    }

    return Result.failure(
      new Error(
        `All providers exhausted. Tried: ${[...tried].join(', ')}. Fallbacks: ${fallbacksUsed.join(
          ', '
        )}`
      )
    );
  }

  private async publishResponseEvent(
    request: LLMRequest,
    response: LLMResponse
  ): Promise<void> {
    if (!this.eventEngine) return;
    try {
      const envelope = EventFactory.createEnvelope(
        request.requestId,
        AggregateType.PROMPT,
        EventType.LLM_RESPONSE_GENERATED,
        'LLM Response Generated',
        {
          requestId: request.requestId,
          provider: response.provider,
          model: response.model,
          totalTokens: response.usage.totalTokens,
          totalCostUsd: response.cost.totalCostUsd,
          latencyMs: response.latencyMs,
          status: response.status,
        },
        {
          userId: request.userId,
          companionId: request.companionId,
          correlationId: request.correlationId ?? request.requestId,
        },
        EventPriority.LOW,
        1
      );
      await this.eventEngine.publish(envelope, EventDispatchMode.ASYNC);
    } catch (err) {
      this.logger.warn(
        { err, requestId: request.requestId },
        'Failed to publish LLM response event'
      );
    }
  }
}

// Attach status to ensure enum is used for typing consumers.
export const LLMResponseSuccessStatus = LLMResponseStatus.SUCCESS;
