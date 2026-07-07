/**
 * CompanionFactory — dependency-injection wiring for the Companion Engine.
 *
 * Mirrors the World/Service factory pattern: a cached singleton assembled from
 * the seeded registry, the default rules/managers/state-machine, and the World
 * Engine. Overrides are supported for tests, with an explicit reset.
 */

import { getWorldEngine, type Clock, type IWorldEngine } from '@engines/world';

import { CompanionEngine } from './companion.engine';
import { ICompanionEngine } from './interfaces/companion-engine.interface';
import { ICompanionRegistry } from './interfaces/companion-registry.interface';
import { CompanionRegistry } from './registry/companion-registry';
import { DefaultCompanionRules } from './rules/companion.rules';
import { CompanionScheduler } from './scheduler/companion-scheduler';
import { CompanionStateMachine } from './state/companion-state-machine';
import { CompanionTransitionManager } from './transitions/companion-transition-manager';
import { ExpressionManager } from './managers/expression.manager';
import { GestureManager } from './managers/gesture.manager';
import { LocationManager } from './managers/location.manager';
import { OutfitManager } from './managers/outfit.manager';
import { AvailabilityManager } from './managers/availability.manager';
import { loadSeedProfiles } from './seed/seed-loader';

/** Overridable dependencies for constructing the engine. */
export interface CompanionEngineDepsOverride {
  registry?: ICompanionRegistry;
  worldEngine?: IWorldEngine;
  clock?: Clock;
}

let cached: ICompanionEngine | null = null;

/**
 * Build (or return the cached) Companion Engine, wired to the World Engine and
 * seeded with the default companion profiles (Kai, Kia).
 *
 * @param deps - Optional overrides (mainly for tests).
 */
export function getCompanionEngine(deps: CompanionEngineDepsOverride = {}): ICompanionEngine {
  if (cached && !hasOverrides(deps)) {
    return cached;
  }

  const registry = deps.registry ?? new CompanionRegistry(loadSeedProfiles());
  const worldEngine = deps.worldEngine ?? getWorldEngine().engine;
  const rules = new DefaultCompanionRules();
  const stateMachine = new CompanionStateMachine(rules);

  const engine = new CompanionEngine({
    registry,
    worldEngine,
    rules,
    scheduler: new CompanionScheduler(),
    stateMachine,
    transitionManager: new CompanionTransitionManager(stateMachine),
    locationManager: new LocationManager(rules),
    expressionManager: new ExpressionManager(),
    gestureManager: new GestureManager(),
    outfitManager: new OutfitManager(),
    availabilityManager: new AvailabilityManager(),
    clock: deps.clock,
  });

  if (!hasOverrides(deps)) {
    cached = engine;
  }

  return engine;
}

/** Reset the cached engine (used by tests to isolate state). */
export function resetCompanionEngine(): void {
  cached = null;
}

function hasOverrides(deps: CompanionEngineDepsOverride): boolean {
  return Boolean(deps.registry || deps.worldEngine || deps.clock);
}
