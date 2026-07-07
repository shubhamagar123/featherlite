/**
 * WorldFactory — dependency-injection wiring for the World Engine.
 *
 * Mirrors the service layer's factory pattern: a cached singleton assembled
 * from the default strategy + selectors + the world service, with overrides for
 * testing and an explicit reset. This is the single composition root for the
 * engine; nothing else news up a WorldEngine in production code.
 */

import { getDatabaseServices, ServiceContainer } from '@services/factory';
import { IWorldService } from '@services/world/world.service.interface';

import { WorldBuilder } from './builder/world.builder';
import { WorldEngine } from './world.engine';
import { WorldScheduler } from './scheduler/world.scheduler';
import { IWorldEngine } from './interfaces/world-engine.interface';
import { IWorldScheduler } from './interfaces/world-scheduler.interface';
import { IWorldStrategy } from './interfaces/world-strategy.interface';
import { DefaultWorldStrategy } from './strategies/default-world.strategy';
import { Clock, SystemClock } from './utils/clock.util';

/** Overridable dependencies for constructing the engine. */
export interface WorldEngineDeps {
  worldService?: IWorldService;
  strategy?: IWorldStrategy;
  clock?: Clock;
}

/** The engine + scheduler pair the factory produces. */
export interface WorldEngineContainer {
  engine: IWorldEngine;
  scheduler: IWorldScheduler;
}

let cached: WorldEngineContainer | null = null;

/**
 * Build (or return the cached) World Engine wired to the service layer.
 *
 * @param deps - Optional overrides (mainly for tests).
 */
export function getWorldEngine(deps: WorldEngineDeps = {}): WorldEngineContainer {
  if (cached && !hasOverrides(deps)) {
    return cached;
  }

  const services: ServiceContainer = getDatabaseServices();
  const worldService = deps.worldService ?? services.worldService;
  const strategy = deps.strategy ?? new DefaultWorldStrategy();
  const clock = deps.clock ?? new SystemClock();

  const builder = new WorldBuilder(strategy);
  const engine = new WorldEngine(worldService, builder, clock);
  const scheduler = new WorldScheduler(engine, clock);

  const container: WorldEngineContainer = { engine, scheduler };

  // Only cache the default wiring so overridden (test) instances stay isolated.
  if (!hasOverrides(deps)) {
    cached = container;
  }

  return container;
}

/** Reset the cached engine (used by tests to isolate state). */
export function resetWorldEngine(): void {
  cached = null;
}

function hasOverrides(deps: WorldEngineDeps): boolean {
  return Boolean(deps.worldService || deps.strategy || deps.clock);
}
