/**
 * RelationshipFactory — dependency-injection wiring for the Relationship Engine.
 *
 * Mirrors the World/Companion factory pattern: a cached singleton assembled from
 * the relationship service, default context/evaluator/updater/strategy implementations,
 * and the Context Engine. Overrides are supported for tests, with an explicit reset.
 */

import { getDatabaseServices, ServiceContainer } from '@services/factory';
import { IRelationshipService } from '@services/relationship/relationship.service.interface';

import { RelationshipEngine } from './relationship.engine';
import type { IRelationshipEngine } from './interfaces/relationship-engine.interface';
import type { IRelationshipContext } from './interfaces/relationship-context.interface';
import type { IRelationshipEvaluator } from './interfaces/relationship-evaluator.interface';
import type { IRelationshipUpdater } from './interfaces/relationship-updater.interface';
import type { IRelationshipEvolutionStrategy } from './interfaces/relationship-strategy.interface';
import { RelationshipContext } from './context/relationship.context';
import { RelationshipEvaluator } from './evaluator/relationship.evaluator';
import { RelationshipUpdater } from './updater/relationship.updater';
import { DefaultEvolutionStrategy } from './strategies/default-evolution.strategy';

/** Overridable dependencies for constructing the engine. */
export interface RelationshipEngineDeps {
  relationshipService?: IRelationshipService;
  relationshipContext?: IRelationshipContext;
  evaluator?: IRelationshipEvaluator;
  updater?: IRelationshipUpdater;
  strategy?: IRelationshipEvolutionStrategy;
}

let cached: IRelationshipEngine | null = null;

/**
 * Build (or return the cached) Relationship Engine wired to the service layer
 * and Context Engine.
 *
 * @param deps - Optional overrides (mainly for tests).
 */
export function getRelationshipEngine(deps: RelationshipEngineDeps = {}): IRelationshipEngine {
  if (cached && !hasOverrides(deps)) {
    return cached;
  }

  const services: ServiceContainer = getDatabaseServices();
  const relationshipService = deps.relationshipService ?? services.relationshipService;
  const relationshipContext = deps.relationshipContext ?? new RelationshipContext();
  const evaluator = deps.evaluator ?? new RelationshipEvaluator(relationshipContext);
  const updater = deps.updater ?? new RelationshipUpdater(relationshipContext);
  const strategy = deps.strategy ?? new DefaultEvolutionStrategy(updater);

  const engine = new RelationshipEngine({
    relationshipService,
    evaluator,
    updater,
    strategy,
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
      deps.relationshipContext ||
      deps.evaluator ||
      deps.updater ||
      deps.strategy
  );
}
