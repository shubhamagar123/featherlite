import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { randomUUID, createHash } from 'crypto';
import { IPromptComposer } from '../interfaces/prompt-composer.interface';
import { IPromptValidationService } from '../interfaces/prompt-validation-service.interface';
import { IPromptCompressor } from '../interfaces/prompt-compressor.interface';
import { IPromptCacheService } from '../interfaces/prompt-cache-service.interface';
import {
  PromptBuildContext,
  PromptPayload,
  PromptSegment,
  PromptAnalytics,
} from '../dtos/prompt.dtos';
import { PromptRole, PromptStatus, CompressionLevel } from '../enums/prompt.enums';
import { TemplateRegistry } from '../templates/template-registry';
import { RuleRegistry } from '../rules/rule-registry';
import { RuleCompiler } from '../rules/rule-compiler';
import { ContextInjector } from '../builders/context-injector';
import { TokenBudgeter } from '../builders/token-budgeter';
import { AssemblyStrategyRegistry } from '../strategies/strategy-registry';
import { PromptAnalyticsRecorder } from '../analytics/prompt.analytics';

export interface PromptComposerDeps {
  templates: TemplateRegistry;
  rules: RuleRegistry;
  ruleCompiler: RuleCompiler;
  contextInjector: ContextInjector;
  budgeter: TokenBudgeter;
  strategies: AssemblyStrategyRegistry;
  validator: IPromptValidationService;
  compressor: IPromptCompressor;
  cache: IPromptCacheService;
  analytics: PromptAnalyticsRecorder;
  defaultTtlSeconds?: number;
}

const COMPOSER_VERSION = '1.0.0';

export class PromptComposer implements IPromptComposer {
  private readonly logger: Logger;
  private readonly defaultTtlSeconds: number;

  constructor(private readonly deps: PromptComposerDeps) {
    this.logger = createLogger('PromptComposer');
    this.defaultTtlSeconds = deps.defaultTtlSeconds ?? 60;
  }

  async compose(context: PromptBuildContext): Promise<IResult<PromptPayload>> {
    const startedAt = Date.now();
    try {
      const cacheKey = this.deriveCacheKey(context);
      const cached = await this.deps.cache.get(cacheKey);
      if (cached.isSuccess && cached.value) {
        return Result.success({ ...cached.value, cached: true });
      }

      // 1. Compile rules for this prompt type.
      const applicable = this.deps.rules.findForType(context.promptType);
      const compiledRules = this.deps.ruleCompiler.compile(applicable);
      const renderedRules = this.deps.ruleCompiler.render(compiledRules);

      // 2. Resolve templates for each role.
      const sysTemplate = this.deps.templates.resolve(PromptRole.SYSTEM, context.promptType, context.strategy);
      const devTemplate = this.deps.templates.resolve(PromptRole.DEVELOPER, context.promptType, context.strategy);
      const usrTemplate = this.deps.templates.resolve(PromptRole.USER, context.promptType, context.strategy);

      if (!sysTemplate || !usrTemplate) {
        return Result.failure(
          new Error(
            `Missing required templates for type=${context.promptType} strategy=${context.strategy}`
          )
        );
      }

      // 3. Inject context.
      const conversationHistory = (context.metadata?.conversationHistory as string) ?? '(no history)';
      const userMessage = (context.metadata?.userMessage as string) ?? '';
      const strategyStyle = this.styleFor(context);

      const extras: Record<string, string> = {
        RULES: renderedRules,
        CONVERSATION_HISTORY: conversationHistory,
        USER_MESSAGE: userMessage,
        STRATEGY_STYLE: strategyStyle,
      };

      const systemContent = this.deps.contextInjector.inject(sysTemplate, context, extras);
      const developerContent = devTemplate
        ? this.deps.contextInjector.inject(devTemplate, context, extras)
        : undefined;
      const userContent = this.deps.contextInjector.inject(usrTemplate, context, extras);

      // 4. Build initial segments.
      const initialSegments: PromptSegment[] = [
        {
          id: `seg_${sysTemplate.id}`,
          role: PromptRole.SYSTEM,
          content: systemContent,
          order: 1,
          version: sysTemplate.version,
        },
      ];
      if (developerContent && devTemplate) {
        initialSegments.push({
          id: `seg_${devTemplate.id}`,
          role: PromptRole.DEVELOPER,
          content: developerContent,
          order: 2,
          version: devTemplate.version,
        });
      }
      initialSegments.push({
        id: `seg_${usrTemplate.id}`,
        role: PromptRole.USER,
        content: userContent,
        order: 3,
        version: usrTemplate.version,
      });

      // 5. Apply strategy-specific transformations.
      const strategyExec = this.deps.strategies.get(context.strategy);
      const transformed = await strategyExec.execute(context, initialSegments);
      if (!transformed.isSuccess || !transformed.value) {
        return Result.failure(transformed.error ?? new Error('Strategy assembly failed'));
      }

      const annotated = this.deps.budgeter.annotate(transformed.value);

      // 6. Assemble payload.
      const systemSegment = annotated.find((s) => s.role === PromptRole.SYSTEM)!;
      const developerSegment = annotated.find((s) => s.role === PromptRole.DEVELOPER);
      const userSegment = annotated.find((s) => s.role === PromptRole.USER)!;

      const originalTokens = this.deps.budgeter.segmentTokens(annotated);
      const preCompressAnalytics: PromptAnalytics = {
        templateId: sysTemplate.id,
        strategy: context.strategy,
        originalTokens,
        finalTokens: originalTokens,
        compressionRatio: 1,
        segmentCount: annotated.length,
        rulesInjected: compiledRules.length,
        buildDurationMs: Date.now() - startedAt,
        timestamp: new Date(),
      };

      let payload: PromptPayload = {
        id: `prompt_${randomUUID()}`,
        requestId: context.metadata?.requestId ? String(context.metadata.requestId) : randomUUID(),
        type: context.promptType,
        strategy: context.strategy,
        status: PromptStatus.BUILDING,
        systemPrompt: systemSegment,
        developerPrompt: developerSegment,
        userPrompt: userSegment,
        totalTokens: originalTokens,
        segmentCount: annotated.length,
        rules: compiledRules,
        version: COMPOSER_VERSION,
        validation: { isValid: true, errors: [], warnings: [], rulesViolated: [] },
        analytics: preCompressAnalytics,
        cached: false,
        cacheKey,
        builtAt: new Date(),
      };

      // 7. Compress if needed.
      const compressionLevel = context.compressionLevel ?? CompressionLevel.LIGHT;
      const budget = context.maxTokens ?? sysTemplate.maxTokens ?? Number.MAX_SAFE_INTEGER;
      payload = { ...payload, status: PromptStatus.COMPRESSING };
      const compressed = await this.deps.compressor.compress(payload, budget, compressionLevel);
      if (compressed.isSuccess && compressed.value) {
        payload = compressed.value.prompt;
        payload.analytics.compressionRatio = compressed.value.stats.ratio;
        payload.analytics.finalTokens = payload.totalTokens;
      }

      // 8. Validate.
      payload = { ...payload, status: PromptStatus.VALIDATING };
      const validated = this.deps.validator.validate(payload);
      if (validated.isSuccess && validated.value) {
        payload = { ...payload, validation: validated.value };
        if (!validated.value.isValid) {
          this.logger.warn(
            { errors: validated.value.errors, rulesViolated: validated.value.rulesViolated },
            'Prompt validation reported issues'
          );
        }
      }

      // 9. Finalize.
      payload = {
        ...payload,
        status: PromptStatus.READY,
        analytics: {
          ...payload.analytics,
          buildDurationMs: Date.now() - startedAt,
        },
      };

      this.deps.analytics.record(payload.analytics);
      await this.deps.cache.set(cacheKey, payload, this.defaultTtlSeconds);

      return Result.success(payload);
    } catch (err) {
      this.logger.error({ err }, 'PromptComposer.compose failed');
      return Result.failure(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private deriveCacheKey(context: PromptBuildContext): string {
    const canonical = JSON.stringify({
      type: context.promptType,
      strategy: context.strategy,
      compressionLevel: context.compressionLevel,
      maxTokens: context.maxTokens,
      requestId: context.conversationContext.requestId,
      userId: context.conversationContext.userId,
      companionId: context.conversationContext.companionId,
      user: context.conversationContext.user,
      companion: context.conversationContext.companion,
      world: context.conversationContext.world,
      relationship: context.conversationContext.relationship,
      memories: context.conversationContext.memories.items.map((m) => m.id),
      moments: context.conversationContext.moments.items.map((m) => m.id),
      metadata: this.sanitizeMetadata(context.metadata),
    });
    return createHash('sha256').update(canonical).digest('hex');
  }

  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
    if (!metadata) return {};
    const copy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(metadata)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
        copy[k] = v;
      }
    }
    return copy;
  }

  private styleFor(context: PromptBuildContext): string {
    switch (context.strategy) {
      case 'DETAILED': return 'thorough, structured, expansive';
      case 'CONCISE': return 'terse, direct, minimal';
      case 'EMOTIONAL': return 'warm, empathic, mirroring';
      case 'ANALYTICAL': return 'precise, structured, JSON';
      case 'STANDARD':
      default: return 'balanced, warm, concise';
    }
  }
}
