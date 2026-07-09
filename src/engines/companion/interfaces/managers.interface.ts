/**
 * Manager and rules contracts.
 *
 * Each manager owns exactly one facet of the companion's life and depends only
 * on facets resolved before it (see the engine's resolution order). Every
 * manager is an interface with a default implementation so a single facet's
 * rules can be swapped without touching the rest of the engine.
 */

import type { Scene, Weather } from '@engines/shared';
import { IResult } from '@services/types/result.type';
import {
  Availability,
  CompanionLocation,
  CompanionMood,
  CompanionOutfit,
  CompanionState,
  Expression,
  Gesture,
} from '../enums/companion.enums';
import { CompanionContext } from '../context/companion-context';

export interface IMoodInput {
  context: CompanionContext;
  state: CompanionState;
}

export interface IExpressionInput {
  context: CompanionContext;
  state: CompanionState;
  mood: CompanionMood;
}

export interface IGestureInput {
  context: CompanionContext;
  state: CompanionState;
  location: CompanionLocation;
}

export interface ILocationInput {
  context: CompanionContext;
  state: CompanionState;
}

export interface IOutfitInput {
  context: CompanionContext;
  state: CompanionState;
  location: CompanionLocation;
}

export interface IAvailabilityInput {
  context: CompanionContext;
  state: CompanionState;
  mood: CompanionMood;
}

export interface IExpressionManager {
  resolve(input: IExpressionInput): IResult<Expression>;
}

export interface IGestureManager {
  resolve(input: IGestureInput): IResult<Gesture>;
}

export interface ILocationManager {
  resolve(input: ILocationInput): IResult<CompanionLocation>;
}

export interface IOutfitManager {
  resolve(input: IOutfitInput): IResult<CompanionOutfit>;
}

export interface IAvailabilityManager {
  resolve(input: IAvailabilityInput): IResult<Availability>;
}

/**
 * Gesture weight rules — configurable weights for gesture selection.
 */
export interface IGestureWeights {
  stateWeights: Record<CompanionState, Partial<Record<Gesture, number>>>;
  locationNudges?: {
    outside?: number;
    gym?: number;
    coffee?: number;
  };
  timeNudges?: {
    morningCoffee?: number;
  };
}

/**
 * Location weight rules — configurable weights for location selection.
 */
export interface ILocationWeights {
  stateWeights: Record<CompanionState, Partial<Record<CompanionLocation, number>>>;
  worldSyncBoost?: number;
}

/**
 * Expression weight rules — configurable weights for expression selection.
 */
export interface IExpressionWeights {
  moodWeights: Record<CompanionMood, Partial<Record<Expression, number>>>;
  stateNudges?: Partial<Record<CompanionState, Partial<Record<Expression, number>>>>;
  weatherNudges?: {
    storm?: number;
  };
}

/**
 * CompanionRules — the central, data-driven policy object.
 *
 * It owns the *world synchronization* mappings (world activity -> life state,
 * world scene -> location) and derives mood. Keeping these as rules (data +
 * small pure functions) means behaviour evolves without rewriting managers.
 */
export interface ICompanionRules {
  /** Map a world activity to the companion life-state it implies. */
  mapWorldActivityToState(activity: string): CompanionState;
  /** Map a world scene to the companion location it implies. */
  mapWorldSceneToLocation(scene: Scene): CompanionLocation;
  /** Whether the given weather confines the companion indoors. */
  isConfiningWeather(weather: Weather): boolean;
  /** Derive the companion's mood from context + resolved state. */
  deriveMood(input: IMoodInput): CompanionMood;
}
