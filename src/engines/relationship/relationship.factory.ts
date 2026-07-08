/**
 * RelationshipFactory — dependency-injection wiring for the Relationship Engine.
 *
 * Wires the relationship service, evaluator, updater, strategy, and Event Engine.
 * Overrides are supported for tests, with an explicit reset.
 */

import { getDatabaseServices, ServiceContainer } from '@services/factory';
import { IRelationshipService } from '@services/relationship/relationship.service.interface';
import { getEventEngine, EventEngine } from '@engines/event';

import { RelationshipEngine } from './relationship.engine';
import type { IRelationshipEngine } from './interfaces/relationship-engine.interface';
import type { IRelationshipEvaluator } from './interfaces/relationship-evaluator.interface';
import type { IRelationshipUpdater } from './interfaces/relationship-updater.interface';
import type { IRelationshipEvolutionStrategy } from './interfaces/relationship-strategy.interface';
import { RelationshipEvaluator } from './evaluator/relationship.evaluator';
import { RelationshipUpdater } from './updater/relationship.updater';
import { DefaultEvolutionStrategy } from './strategies/default-evolution.strategy';

/** Overridable dependencies for constructing the engine. */
export interface RelationshipEngineDeps {
  relationshipService?: IRelationshipService;
  evaluator?: IRelationshipEvaluator;
  updater?: IRelationshipUpdater;
  strategy?: IRelationshipEvolutionStrategy;
  eventEngine?: EventEngine;
}

let cached: IRelationshipEngine | null = null;

/**
 * Build (or return the cached) Relationship Engine wired to the service layer,
 * Event Engine, and Context Engine.
 *
 * @param deps - Optional overrides (mainly for tests).
 */
export function getRelationshipEngine(deps: RelationshipEngineDeps = {}): IRelationshipEngine {
  if (cached && !hasOverrides(deps)) {
    return cached;
  }

  const services: ServiceContainer = getDatabaseServices();
  const relationshipService = deps.relationshipService ?? services.relationshipService;
  const evaluator = deps.evaluator ?? new RelationshipEvaluator();
  const updater = deps.updater ?? new RelationshipUpdater();
  const strategy = deps.strategy ?? new DefaultEvolutionStrategy(updater);
  const eventEngine = deps.eventEngine ?? getEventEngine();

  const engine = new RelationshipEngine({
    relationshipService,
    evaluator,
    updater,
    strategy,
    eventEngine,
  });

  if (!hasOverrides(deps)) {
    cached = engine;
  }

  return engine;
}

/** Reset the cached engine (used by tests to isolate state). */
export function resetRelationshipEngine(): void {
  cached = null;
}

function hasOverrides(deps: RelationshipEngineDeps): boolean {
  return Boolean(
    deps.relationshipService ||
      deps.evaluator ||
      deps.updater ||
      deps.strategy ||
      deps.eventEngine
  );
}
