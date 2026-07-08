import type { IPromptEngine } from './interfaces/prompt-engine.interface';

export interface PromptEngineDeps {
  promptEngine?: IPromptEngine;
}

let cached: IPromptEngine | null = null;

export function getPromptEngine(_deps: PromptEngineDeps = {}): IPromptEngine {
  if (_deps.promptEngine) {
    return _deps.promptEngine;
  }

  if (cached) {
    return cached;
  }

  throw new Error(
    'PromptEngine: no implementation registered yet. ' +
      'Call getPromptEngine({ promptEngine }) with a concrete instance first.'
  );
}

export function registerPromptEngine(engine: IPromptEngine): void {
  cached = engine;
}

export function resetPromptEngine(): void {
  cached = null;
}
