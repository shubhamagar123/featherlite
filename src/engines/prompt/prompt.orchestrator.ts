import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { IPromptOrchestrator } from './interfaces/prompt-orchestrator.interface';
import { IPromptComposer } from './interfaces/prompt-composer.interface';
import { IPromptCacheService } from './interfaces/prompt-cache-service.interface';
import { PromptBuildContext, PromptPayload, PromptAnalytics } from './dtos/prompt.dtos';
import { PromptAnalyticsRecorder } from './analytics/prompt.analytics';
import { EventEngine } from '@engines/event';
import { EventType, AggregateType, EventPriority, EventDispatchMode } from '@engines/event';
import { EventFactory } from '@engines/event';

export interface PromptOrchestratorDependencies {
  composer: IPromptComposer;
  cache: IPromptCacheService;
  analytics: PromptAnalyticsRecorder;
  eventEngine?: EventEngine;
}

export class PromptOrchestrator implements IPromptOrchestrator {
  private readonly logger: Logger;

  constructor(private readonly deps: PromptOrchestratorDependencies) {
    this.logger = createLogger('PromptOrchestrator');
  }

  async buildPrompt(context: PromptBuildContext): Promise<IResult<PromptPayload>> {
    const result = await this.deps.composer.compose(context);
    if (result.isSuccess && result.value) {
      await this.publishPromptBuiltEvent(result.value);
    } else {
      this.logger.warn({ err: result.error }, 'buildPrompt failed');
    }
    return result;
  }

  async getCachedPrompt(cacheKey: string): Promise<IResult<PromptPayload | null>> {
    const result = await this.deps.cache.get(cacheKey);
    if (result.isSuccess && result.value) {
      return Result.success({ ...result.value, cached: true });
    }
    return result;
  }

  async getAnalytics(templateId: string): Promise<IResult<PromptAnalytics[]>> {
    return Result.success(this.deps.analytics.getForTemplate(templateId));
  }

  private async publishPromptBuiltEvent(payload: PromptPayload): Promise<void> {
    if (!this.deps.eventEngine) return;
    try {
      const envelope = EventFactory.createEnvelope(
        payload.id,
        AggregateType.PROMPT,
        EventType.PROMPT_BUILT,
        'Prompt Built',
        {
          promptId: payload.id,
          requestId: payload.requestId,
          type: payload.type,
          strategy: payload.strategy,
          totalTokens: payload.totalTokens,
          cached: payload.cached,
          buildDurationMs: payload.analytics.buildDurationMs,
        },
        { correlationId: payload.requestId },
        EventPriority.LOW,
        1
      );
      await this.deps.eventEngine.publish(envelope, EventDispatchMode.ASYNC);
    } catch (err) {
      this.logger.warn({ err }, 'Failed to publish PROMPT_BUILT event');
    }
  }
}
