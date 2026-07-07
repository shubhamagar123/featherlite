import type { IRelationshipEngine } from './interfaces/relationship-engine.interface';

export interface RelationshipEngineDeps {
  relationshipEngine?: IRelationshipEngine;
}

let cached: IRelationshipEngine | null = null;

export function getRelationshipEngine(
  _deps: RelationshipEngineDeps = {}
): IRelationshipEngine {
  if (_deps.relationshipEngine) {
    return _deps.relationshipEngine;
  }

  if (cached) {
    return cached;
  }

  throw new Error(
    'RelationshipEngine: no implementation registered yet. ' +
      'Call getRelationshipEngine({ relationshipEngine }) with a concrete instance first.'
  );
}

export function registerRelationshipEngine(engine: IRelationshipEngine): void {
  cached = engine;
}

export function resetRelationshipEngine(): void {
  cached = null;
}
