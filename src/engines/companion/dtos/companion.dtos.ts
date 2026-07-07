/**
 * Companion Engine data transfer objects.
 *
 * A companion's *profile* (identity + schedule + preferences) is pure data,
 * supplied by seed data — never hardcoded in engine logic. Adding a new
 * companion is a data operation, not a code change. The resolved *snapshot* is
 * the engine's primary output: the companion's live life-state at a moment.
 */

import type { GeneratedWorldDTO } from '@engines/world';
import type { Scene, TimeOfDay, Weather } from '@engines/world';
import {
  AgeRange,
  Availability,
  Chronotype,
  CompanionLocation,
  CompanionMood,
  CompanionOutfit,
  CompanionState,
  Expression,
  Gender,
  Gesture,
} from '../enums/companion.enums';

// ---------------------------------------------------------------------------
// Profile (seed data)
// ---------------------------------------------------------------------------

export interface CompanionIdentityDTO {
  name: string;
  displayName: string;
  avatar?: string;
  voice: string;
  gender: Gender;
  ageRange: AgeRange;
  biography: string;
}

/**
 * A block of the companion's day. `startHour` is inclusive, `endHour`
 * exclusive; a block may wrap past midnight (e.g. 22 -> 6 for a sleep block).
 */
export interface CompanionScheduleBlockDTO {
  label: string;
  startHour: number; // 0-23
  endHour: number; // 1-24 (exclusive); may be < startHour to wrap midnight
  state: CompanionState;
  location?: CompanionLocation;
}

export interface CompanionScheduleDTO {
  /** Optional companion-preferred timezone for interpreting block hours. */
  timezone?: string;
  blocks: CompanionScheduleBlockDTO[];
}

/** Normalized personality axes in [0, 1]; bias moods, expressions, gestures. */
export interface CompanionPersonalityDTO {
  playfulness: number;
  focus: number;
  warmth: number;
  energy: number;
}

export interface CompanionPreferencesDTO {
  chronotype: Chronotype;
  personality: CompanionPersonalityDTO;
  favoriteActivities: CompanionState[];
  preferredOutfits: CompanionOutfit[];
}

export interface CompanionProfileDTO {
  /** Stable identifier used by the registry (companion id or seed id). */
  id: string;
  /** Stable, human-readable seed key (e.g. "kai"). Never used in engine logic. */
  seedKey: string;
  identity: CompanionIdentityDTO;
  schedule: CompanionScheduleDTO;
  preferences: CompanionPreferencesDTO;
}

// ---------------------------------------------------------------------------
// Resolution inputs / outputs
// ---------------------------------------------------------------------------

/** Optional relationship / status signals that bias life-state resolution. */
export interface CompanionSignals {
  /** Relationship affection score (-100..100), if known. */
  affection?: number;
  /** Relationship level label, if known. */
  relationshipLevel?: string;
  /** Explicit companion status override (from CompanionService). */
  statusOverride?: 'ACTIVE' | 'INACTIVE' | 'BUSY';
}

export interface ResolveCompanionOptions {
  companionId: string;
  /**
   * World to synchronize with. If omitted, the engine obtains the current world
   * for this companion from the World Engine.
   */
  world?: GeneratedWorldDTO;
  referenceDate?: Date;
  timezone?: string;
  signals?: CompanionSignals;
  /** Prior life-state, used to smooth transitions through the state machine. */
  previousState?: CompanionState;
}

/**
 * The companion's fully resolved life-state at a moment in time. This is the
 * engine's primary deliverable.
 */
export interface CompanionStateSnapshotDTO {
  companionId: string;
  name: string;
  displayName: string;

  date: string;
  timezone: string;
  timeOfDay: TimeOfDay;

  state: CompanionState;
  mood: CompanionMood;
  expression: Expression;
  gesture: Gesture;
  location: CompanionLocation;
  outfit: CompanionOutfit;
  availability: Availability;

  /** Label of the active schedule block that shaped this snapshot. */
  scheduleLabel: string;
  /** World facets the companion synchronized against. */
  worldScene: Scene;
  worldWeather: Weather;

  seed: number;
  resolvedAt: string;
}

/** Result of validating/advancing a state transition. */
export interface CompanionTransitionDTO {
  from: CompanionState;
  to: CompanionState;
  /** True when `to` was directly reachable from `from`. */
  direct: boolean;
  /** The next state to step to (equals `to` when direct). */
  next: CompanionState;
  /** Full shortest path from `from` to `to` (inclusive of both ends). */
  path: CompanionState[];
}
