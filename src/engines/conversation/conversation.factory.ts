import { getContextEngine } from '@engines/context';
import { getPromptOrchestrator } from '@engines/prompt';
import { getLLMGateway } from '@engines/llm-gateway';
import { getMemoryExtractionEngine } from '@engines/memory-extraction';
import { getDatabaseServices, ServiceContainer } from '@services/factory';
import { ConversationEngine, ConversationEngineDeps } from './conversation.engine';
import type { IConversationEngine } from './interfaces/conversation-engine.interface';

/** Overridable dependencies for constructing the engine (mainly for tests). */
export type ConversationEngineDepsOverride = Partial<ConversationEngineDeps> & {
  serviceOverrides?: Partial<ServiceContainer>;
};

let cached: IConversationEngine | null = null;

/**
 * Build (or return the cached) Conversation Engine.
 *
 * Wiring intentionally mirrors the boundary rules documented on
 * IConversationEngine: Context Engine for state, Prompt Engine for
 * prompts, the LLM Gateway for completions, the Memory Extraction Engine
 * for (propose-only) candidates, and the Memory Service — via its public
 * interface — as the sole, consent-gated path to persistence.
 */
export function getConversationEngine(deps: ConversationEngineDepsOverride = {}): IConversationEngine {
  if (hasOverrides(deps)) {
    return buildEngine(deps);
  }

  if (cached) {
    return cached;
  }

  cached = buildEngine(deps);
  return cached;
}

function buildEngine(deps: ConversationEngineDepsOverride): IConversationEngine {
  const services: ServiceContainer = getDatabaseServices();

  return new ConversationEngine({
    contextEngine: deps.contextEngine ?? getContextEngine(),
    promptOrchestrator: deps.promptOrchestrator ?? getPromptOrchestrator(),
    llmGateway: deps.llmGateway ?? getLLMGateway(),
    memoryExtractionEngine: deps.memoryExtractionEngine ?? getMemoryExtractionEngine(),
    memoryService: deps.memoryService ?? deps.serviceOverrides?.memoryService ?? services.memoryService,
  });
}

/** Reset the cached engine (used by tests to isolate state). */
export function resetConversationEngine(): void {
  cached = null;
}

function hasOverrides(deps: ConversationEngineDepsOverride): boolean {
  return Boolean(
    deps.contextEngine ||
      deps.promptOrchestrator ||
      deps.llmGateway ||
      deps.memoryExtractionEngine ||
      deps.memoryService ||
      deps.serviceOverrides
  );
}
