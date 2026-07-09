import type { IPromptOrchestrator } from './interfaces/prompt-orchestrator.interface';
import { PromptOrchestrator } from './prompt.orchestrator';
import { PromptComposer } from './composers/prompt.composer';
import { PromptCompressor } from './compressor/prompt.compressor';
import { PromptValidator } from './validator/prompt.validator';
import { RedisPromptCacheService } from '@infra/cache/redis-prompt-cache.service';
import { PromptAnalyticsRecorder } from './analytics/prompt.analytics';
import { TemplateRegistry } from './templates/template-registry';
import { RuleRegistry } from './rules/rule-registry';
import { RuleCompiler } from './rules/rule-compiler';
import { ContextInjector } from './builders/context-injector';
import { TokenBudgeter } from './builders/token-budgeter';
import { AssemblyStrategyRegistry } from './strategies/strategy-registry';
import { EventEngine, getEventEngine } from '@engines/event';
import { getRedisClient } from '@infra/redis/redis.provider';

export interface PromptOrchestratorDeps {
  promptOrchestrator?: IPromptOrchestrator;
  templates?: TemplateRegistry;
  rules?: RuleRegistry;
  eventEngine?: EventEngine;
  defaultCacheTtlSeconds?: number;
}

let cached: IPromptOrchestrator | null = null;

export function getPromptOrchestrator(deps: PromptOrchestratorDeps = {}): IPromptOrchestrator {
  if (deps.promptOrchestrator) return deps.promptOrchestrator;
  if (cached && !hasOverrides(deps)) return cached;

  const templates = deps.templates ?? new TemplateRegistry();
  const rules = deps.rules ?? new RuleRegistry();
  const cache = new RedisPromptCacheService(getRedisClient());
  const analytics = new PromptAnalyticsRecorder();
  const eventEngine = deps.eventEngine ?? getEventEngine();

  const composer = new PromptComposer({
    templates,
    rules,
    ruleCompiler: new RuleCompiler(),
    contextInjector: new ContextInjector(),
    budgeter: new TokenBudgeter(),
    strategies: new AssemblyStrategyRegistry(),
    validator: new PromptValidator(),
    compressor: new PromptCompressor(),
    cache,
    analytics,
    defaultTtlSeconds: deps.defaultCacheTtlSeconds ?? 60,
  });

  const orchestrator = new PromptOrchestrator({ composer, cache, analytics, eventEngine });

  if (!hasOverrides(deps)) cached = orchestrator;
  return orchestrator;
}

export function registerPromptOrchestrator(orchestrator: IPromptOrchestrator): void {
  cached = orchestrator;
}

export function resetPromptOrchestrator(): void {
  cached = null;
}

function hasOverrides(deps: PromptOrchestratorDeps): boolean {
  return Boolean(deps.templates || deps.rules || deps.eventEngine || deps.defaultCacheTtlSeconds);
}
