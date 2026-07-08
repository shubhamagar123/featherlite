import { EventEngine } from './event.engine';
import { EventRetryPolicy } from './dto/event.dto';

let cached: EventEngine | null = null;

export interface EventEngineDeps {
  retryPolicy?: EventRetryPolicy;
}

export function getEventEngine(deps: EventEngineDeps = {}): EventEngine {
  if (cached && !hasOverrides(deps)) {
    return cached;
  }

  const engine = new EventEngine(deps.retryPolicy);

  if (!hasOverrides(deps)) {
    cached = engine;
  }

  return engine;
}

export function resetEventEngine(): void {
  cached = null;
}

function hasOverrides(deps: EventEngineDeps): boolean {
  return Boolean(deps.retryPolicy);
}
