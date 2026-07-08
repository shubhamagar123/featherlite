import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { ILLMProvider } from '../interfaces/llm-provider.interface';
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMProviderHealth,
  LLMProviderConfig,
  LLMTokenUsage,
  LLMCostBreakdown,
} from '../dtos/llm-gateway.dtos';
import {
  LLMProviderType,
  LLMResponseStatus,
  LLMFinishReason,
  LLMProviderStatus,
} from '../enums/llm-gateway.enums';

/**
 * Provider-side transport contract. Concrete providers inject a transport
 * implementation (real HTTP client in production; mock in tests). This keeps
 * the runtime logic (retries, timeouts, token accounting, cost math) provider-
 * agnostic and testable.
 */
export interface LLMProviderTransport {
  invoke(request: LLMRequest, config: LLMProviderConfig): Promise<{
    content: string;
    finishReason: LLMFinishReason;
    promptTokens: number;
    completionTokens: number;
    model: string;
  }>;
  invokeStream?(
    request: LLMRequest,
    config: LLMProviderConfig
  ): AsyncIterable<{ delta: string; finished: boolean; finishReason?: LLMFinishReason }>;
}

export abstract class BaseLLMProvider implements ILLMProvider {
  protected readonly logger: Logger;
  protected available: boolean = true;
  protected consecutiveFailures: number = 0;
  protected recentLatencies: number[] = [];
  protected recentErrors: number = 0;
  protected recentAttempts: number = 0;

  abstract readonly type: LLMProviderType;

  constructor(
    public readonly config: LLMProviderConfig,
    protected readonly transport: LLMProviderTransport
  ) {
    this.logger = createLogger(`LLMProvider:${this.constructor.name}`);
  }

  async complete(request: LLMRequest): Promise<IResult<LLMResponse>> {
    const startedAt = Date.now();
    this.recentAttempts++;

    try {
      const timeoutMs = request.timeoutMs ?? this.config.timeoutMs;
      const providerResponse = await this.withTimeout(
        this.transport.invoke(request, this.config),
        timeoutMs
      );

      const latencyMs = Date.now() - startedAt;
      this.trackLatency(latencyMs);
      this.consecutiveFailures = 0;

      const usage: LLMTokenUsage = {
        promptTokens: providerResponse.promptTokens,
        completionTokens: providerResponse.completionTokens,
        totalTokens: providerResponse.promptTokens + providerResponse.completionTokens,
      };

      const cost = this.computeCost(usage);

      const response: LLMResponse = {
        requestId: request.requestId,
        provider: this.type,
        model: providerResponse.model,
        status: LLMResponseStatus.SUCCESS,
        content: providerResponse.content,
        finishReason: providerResponse.finishReason,
        usage,
        cost,
        latencyMs,
        cached: false,
        attempt: 1,
        fallbacksUsed: [],
        createdAt: new Date(),
      };

      return Result.success(response);
    } catch (error) {
      this.consecutiveFailures++;
      this.recentErrors++;
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.warn(
        { provider: this.type, requestId: request.requestId, error: err.message },
        'Provider complete failed'
      );
      return Result.failure(err);
    }
  }

  async *stream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    if (!this.transport.invokeStream) {
      throw new Error(`Provider ${this.type} does not support streaming`);
    }

    let index = 0;
    try {
      for await (const chunk of this.transport.invokeStream(request, this.config)) {
        yield {
          requestId: request.requestId,
          provider: this.type,
          model: this.config.model,
          delta: chunk.delta,
          finished: chunk.finished,
          finishReason: chunk.finishReason,
          index: index++,
        };
      }
    } catch (error) {
      this.consecutiveFailures++;
      this.recentErrors++;
      throw error;
    }
  }

  async healthCheck(): Promise<IResult<LLMProviderHealth>> {
    const latencyP95Ms = this.percentile(this.recentLatencies, 0.95);
    const errorRate =
      this.recentAttempts === 0 ? 0 : (this.recentErrors / this.recentAttempts) * 100;

    let status = LLMProviderStatus.HEALTHY;
    if (this.consecutiveFailures >= 5 || errorRate > 50) {
      status = LLMProviderStatus.UNHEALTHY;
    } else if (this.consecutiveFailures >= 2 || errorRate > 20) {
      status = LLMProviderStatus.DEGRADED;
    }

    const health: LLMProviderHealth = {
      provider: this.type,
      status,
      latencyP95Ms,
      errorRatePercent: errorRate,
      lastCheckedAt: new Date(),
      consecutiveFailures: this.consecutiveFailures,
    };

    return Result.success(health);
  }

  estimateTokens(text: string): number {
    if (!text) return 0;
    // Deterministic approximation used by all providers: ~4 chars/token.
    // Rounded up so short inputs still count as ≥ 1 token.
    return Math.ceil(text.length / 4);
  }

  isAvailable(): boolean {
    return this.available && this.config.enabled;
  }

  protected computeCost(usage: LLMTokenUsage): LLMCostBreakdown {
    const promptCostUsd =
      (usage.promptTokens / 1_000_000) * this.config.pricing.promptCostPerMillion;
    const completionCostUsd =
      (usage.completionTokens / 1_000_000) * this.config.pricing.completionCostPerMillion;
    return {
      promptCostUsd,
      completionCostUsd,
      totalCostUsd: promptCostUsd + completionCostUsd,
    };
  }

  protected trackLatency(latencyMs: number): void {
    this.recentLatencies.push(latencyMs);
    if (this.recentLatencies.length > 200) {
      this.recentLatencies.shift();
    }
  }

  protected percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
    return sorted[idx];
  }

  protected async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Provider ${this.type} timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
