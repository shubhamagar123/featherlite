import { IMomentEngine } from './interfaces/moment.interfaces';
import { MomentEngine, MomentEngineDeps } from './moment.engine';
import { EventEngine, getEventEngine } from '@engines/event';
import { getDatabaseServices } from '@services/factory';

let cached: IMomentEngine | null = null;

export interface MomentEngineFactoryDeps extends MomentEngineDeps {
  eventEngine?: EventEngine;
}

export function getMomentEngine(deps: MomentEngineFactoryDeps = {}): IMomentEngine {
  if (cached && !hasOverrides(deps)) return cached;

  const engine = new MomentEngine({
    ...deps,
    eventEngine: deps.eventEngine ?? getEventEngine(),
    momentService: deps.momentService ?? tryGetMomentService(),
  });

  if (!hasOverrides(deps)) cached = engine;
  return engine;
}

export function resetMomentEngine(): void {
  cached = null;
}

function tryGetMomentService() {
  try {
    return getDatabaseServices().momentService;
  } catch {
    return undefined;
  }
}

function hasOverrides(deps: MomentEngineFactoryDeps): boolean {
  return Boolean(
    deps.evaluator ||
      deps.generator ||
      deps.scheduler ||
      deps.rules ||
      deps.eventEngine ||
      deps.momentService
  );
}
