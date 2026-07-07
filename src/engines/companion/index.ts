/**
 * Companion Engine public API.
 *
 * Import from `@engines/companion` rather than reaching into subpaths.
 */

// Factory (composition root)
export { getCompanionEngine, resetCompanionEngine } from './companion.factory';
export type { CompanionEngineDepsOverride } from './companion.factory';

// Engine
export { CompanionEngine } from './companion.engine';
export type { CompanionEngineDeps } from './companion.engine';

// Context
export { CompanionContext } from './context/companion-context';

// Registry
export { CompanionRegistry } from './registry/companion-registry';

// Rules
export { DefaultCompanionRules } from './rules/companion.rules';

// State machine, scheduler, transitions
export { CompanionStateMachine } from './state/companion-state-machine';
export { CompanionScheduler } from './scheduler/companion-scheduler';
export { CompanionTransitionManager } from './transitions/companion-transition-manager';

// Managers
export { ExpressionManager } from './managers/expression.manager';
export { GestureManager } from './managers/gesture.manager';
export { LocationManager } from './managers/location.manager';
export { OutfitManager } from './managers/outfit.manager';
export { AvailabilityManager } from './managers/availability.manager';

// Seed
export { loadSeedProfiles } from './seed/seed-loader';

// Interfaces
export type { ICompanionEngine } from './interfaces/companion-engine.interface';
export type { ICompanionRegistry } from './interfaces/companion-registry.interface';
export type { ICompanionScheduler } from './interfaces/companion-scheduler.interface';
export type { ICompanionStateMachine } from './interfaces/state-machine.interface';
export type { ICompanionTransitionManager } from './interfaces/transition-manager.interface';
export type {
  ICompanionRules,
  IExpressionManager,
  IGestureManager,
  ILocationManager,
  IOutfitManager,
  IAvailabilityManager,
  IMoodInput,
  IExpressionInput,
  IGestureInput,
  ILocationInput,
  IOutfitInput,
  IAvailabilityInput,
} from './interfaces/managers.interface';

// DTOs
export type {
  CompanionIdentityDTO,
  CompanionScheduleBlockDTO,
  CompanionScheduleDTO,
  CompanionPersonalityDTO,
  CompanionPreferencesDTO,
  CompanionProfileDTO,
  CompanionSignals,
  ResolveCompanionOptions,
  CompanionStateSnapshotDTO,
  CompanionTransitionDTO,
} from './dtos/companion.dtos';

// Enums
export {
  CompanionState,
  CompanionMood,
  Expression,
  Gesture,
  CompanionLocation,
  CompanionOutfit,
  Availability,
  Gender,
  AgeRange,
  Chronotype,
} from './enums/companion.enums';
