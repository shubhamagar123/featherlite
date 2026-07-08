/**
 * ContextFactory — dependency-injection wiring for the Context Engine.
 *
 * This is the single composition root that connects the providers to their
 * upstream sources (World Engine, Companion Engine, Relationship Engine, and
 * the services). Mirrors the World/Companion factory pattern: a cached
 * singleton with test overrides and an explicit reset.
 */

import { getDatabaseServices, ServiceContainer } from '@services/factory';
import { getWorldEngine, type Clock, type IWorldEngine } from '@engines/world';
import { getCompanionEngine, type ICompanionEngine } from '@engines/companion';
import { getRelationshipEngine, type IRelationshipEngine } from '@engines/relationship';
import { getMemoryEngine, type IMemoryEngine } from '@engines/memory';

import { ContextBuilder } from './builder/context.builder';
import { ContextEngine } from './context.engine';
import { IContextEngine } from './interfaces/context-engine.interface';
import { ContextProviderSet } from './interfaces/context-builder.interface';
import { UserContextProvider } from './providers/user-context.provider';
import { WorldContextProvider } from './providers/world-context.provider';
import { CompanionContextProvider } from './providers/companion-context.provider';
import { RelationshipContextProvider } from './providers/relationship-context.provider';
import { MemoryContextProvider } from './providers/memory-context.provider';
import { MomentsContextProvider } from './providers/moments-context.provider';

/** Overridable dependencies for constructing the engine (mainly for tests). */
export interface ContextEngineDeps {
  services?: ServiceContainer;
  worldEngine?: IWorldEngine;
  companionEngine?: ICompanionEngine;
  relationshipEngine?: IRelationshipEngine;
  memoryEngine?: IMemoryEngine;
  clock?: Clock;
}

let cached: IContextEngine | null = null;

/**
 * Build the provider set from the given sources. Exposed so tests can assemble
 * a provider set without the singleton.
 */
export function buildProviderSet(
  services: ServiceContainer,
  worldEngine: IWorldEngine,
  companionEngine: ICompanionEngine,
  relationshipEngine: IRelationshipEngine,
  memoryEngine: IMemoryEngine
): ContextProviderSet {
  return {
    user: new UserContextProvider(services.userService),
    companion: new CompanionContextProvider(companionEngine),
    world: new WorldContextProvider(worldEngine),
    relationship: new RelationshipContextProvider(relationshipEngine),
    memory: new MemoryContextProvider(memoryEngine),
    moments: new MomentsContextProvider(services.momentService),
  };
}

/**
 * Build (or return the cached) Context Engine, wired to the World Engine, the
 * Companion Engine, the Relationship Engine, the Memory Engine, and services.
 *
 * @param deps - Optional overrides (mainly for tests).
 */
export function getContextEngine(deps: ContextEngineDeps = {}): IContextEngine {
  if (cached && !hasOverrides(deps)) {
    return cached;
  }

  const services = deps.services ?? getDatabaseServices();
  const worldEngine = deps.worldEngine ?? getWorldEngine().engine;
  const companionEngine = deps.companionEngine ?? getCompanionEngine();
  const relationshipEngine = deps.relationshipEngine ?? getRelationshipEngine();
  const memoryEngine = deps.memoryEngine ?? getMemoryEngine();

  const providers = buildProviderSet(
    services,
    worldEngine,
    companionEngine,
    relationshipEngine,
    memoryEngine
  );
  const builder = new ContextBuilder(providers, deps.clock);
  const engine = new ContextEngine(builder);

  if (!hasOverrides(deps)) {
    cached = engine;
  }

  return engine;
}

/** Reset the cached engine (used by tests to isolate state). */
export function resetContextEngine(): void {
  cached = null;
}

function hasOverrides(deps: ContextEngineDeps): boolean {
  return Boolean(
    deps.services ||
      deps.worldEngine ||
      deps.companionEngine ||
      deps.relationshipEngine ||
      deps.memoryEngine ||
      deps.clock
  );
}
