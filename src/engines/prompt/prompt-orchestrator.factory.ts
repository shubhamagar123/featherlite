import type { IPromptOrchestrator } from './interfaces/prompt-orchestrator.interface';

export interface PromptOrchestratorDeps {
  promptOrchestrator?: IPromptOrchestrator;
}

let cached: IPromptOrchestrator | null = null;

export function getPromptOrchestrator(_deps: PromptOrchestratorDeps = {}): IPromptOrchestrator {
  if (_deps.promptOrchestrator) {
    return _deps.promptOrchestrator;
  }

  if (cached) {
    return cached;
  }

  throw new Error(
    'PromptOrchestrator: no implementation registered yet. ' +
      'Call getPromptOrchestrator({ promptOrchestrator }) with a concrete instance first.'
  );
}

export function registerPromptOrchestrator(orchestrator: IPromptOrchestrator): void {
  cached = orchestrator;
}

export function resetPromptOrchestrator(): void {
  cached = null;
}
