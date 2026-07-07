/**
 * World Engine data transfer objects.
 *
 * These describe the *inputs* to and *outputs* of world generation. They are
 * plain, serializable value objects — the controller/route layer (built later)
 * will translate these to/from HTTP without the engine ever knowing about it.
 */

import {
  Activity,
  AmbientSound,
  KitchenState,
  Lighting,
  Music,
  Openable,
  Outfit,
  PlantState,
  Scene,
  Season,
  TimeOfDay,
  Toggle,
  Weather,
  WorldMode,
} from '../enums/world.enums';

/**
 * Optional signals that can bias generation. These are deliberately additive:
 * the default strategy/selectors work without them, but future rule evolutions
 * can read them (e.g. higher affection nudging toward SPECIAL_MOMENT).
 */
export interface WorldSignals {
  /** Relationship affection level (repository scale), if known. */
  affectionLevel?: number;
  /** Engagement score in [0, 1], if known. */
  engagementScore?: number;
  /** A caller-provided mood hint (kept free-form for forward flexibility). */
  moodHint?: string;
}

/**
 * Options controlling a single world generation.
 */
export interface GenerateWorldOptions {
  /** Companion whose world is being generated. */
  companionId: string;
  /**
   * Instant to generate the world "as of". Defaults to the engine clock's now.
   * Supplying it makes generation fully reproducible in tests.
   */
  referenceDate?: Date;
  /** IANA timezone id used for time-of-day / day-boundary math. Defaults to UTC. */
  timezone?: string;
  /** Optional biasing signals. */
  signals?: WorldSignals;
}

/**
 * Structured snapshot of the companion's living space.
 */
export interface HouseStateDTO {
  curtains: Openable;
  doors: Openable;
  tv: Toggle;
  music: Toggle;
  lights: Toggle;
  plants: PlantState;
  kitchen: KitchenState;
  /** Highlighted objects currently "in focus" in the scene. */
  objects: string[];
}

/**
 * The fully generated world for a companion at a moment in time. This is the
 * primary output of the World Engine.
 */
export interface GeneratedWorldDTO {
  companionId: string;
  /** Local day key (YYYY-MM-DD) this world belongs to. */
  date: string;
  /** Timezone used to generate the world. */
  timezone: string;

  mode: WorldMode;
  timeOfDay: TimeOfDay;
  season: Season;
  weather: Weather;
  scene: Scene;
  activity: Activity;
  outfit: Outfit;
  lighting: Lighting;
  ambientSound: AmbientSound;
  music: Music;
  houseState: HouseStateDTO;

  /** Human-readable emotional tone of the world (persisted as globalMood). */
  mood: string;

  /** Deterministic seed that produced this world (for debugging/snapshots). */
  seed: number;
  /** ISO timestamp of when generation ran. */
  generatedAt: string;
}
