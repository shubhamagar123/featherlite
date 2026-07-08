export {
  getRelationshipEngine,
  resetRelationshipEngine,
} from './relationship.factory';
export type { RelationshipEngineDeps } from './relationship.factory';

export type { IRelationshipEngine } from './interfaces/relationship-engine.interface';
export type { IRelationshipContext } from './interfaces/relationship-context.interface';
export type { IRelationshipEvaluator } from './interfaces/relationship-evaluator.interface';
export type { IRelationshipUpdater } from './interfaces/relationship-updater.interface';
export type { IRelationshipEvolutionStrategy } from './interfaces/relationship-strategy.interface';

export type {
  RelationshipState,
  RelationshipSnapshot,
  RelationshipDimension,
  RelationshipEvent,
  RelationshipTimeline,
  InteractionEvaluationInput,
  InteractionEvaluationResult,
  GrowthFactorScore,
  RelationshipEvolutionContext,
  EvolutionStrategy,
  RelationshipCalculationContext,
  DimensionGrowthRule,
} from './dtos/relationship.dtos';

export {
  RelationshipDimensionType,
  RelationshipStatus,
  RelationshipEventType,
  InteractionQuality,
  DimensionChange,
  GrowthStrategyType,
  RelationshipPhase,
} from './enums/relationship.enums';
