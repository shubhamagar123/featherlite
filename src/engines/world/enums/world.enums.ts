/**
 * World Engine domain enumerations.
 *
 * Every value the World Engine can produce is enumerated here. Selectors and
 * strategies operate exclusively on these enums so the world model is a closed,
 * fully-typed vocabulary. No free-form strings are used inside the engine.
 *
 * Note: TimeOfDay, Weather, Scene, and WorldMode are now defined in @engines/shared
 * and re-exported here for backwards compatibility.
 */

// Re-export shared kernel enums for backwards compatibility
export { TimeOfDay, Weather, Scene, WorldMode } from '@engines/shared';

/** Meteorological season, derived deterministically from the calendar month. */
export enum Season {
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  AUTUMN = 'AUTUMN',
  WINTER = 'WINTER',
}

/** Activity the companion is engaged in. */
export enum Activity {
  READING = 'READING',
  COOKING = 'COOKING',
  WORKING = 'WORKING',
  GAMING = 'GAMING',
  WATCHING_TV = 'WATCHING_TV',
  COFFEE = 'COFFEE',
  WALKING = 'WALKING',
  GYM = 'GYM',
  CLEANING = 'CLEANING',
  RELAXING = 'RELAXING',
}

/** Outfit the companion is wearing. */
export enum Outfit {
  HOME_WEAR = 'HOME_WEAR',
  CASUAL = 'CASUAL',
  OFFICE = 'OFFICE',
  GYM = 'GYM',
  TRAVEL = 'TRAVEL',
  FESTIVAL = 'FESTIVAL',
}

/** Lighting mood of the scene. */
export enum Lighting {
  BRIGHT = 'BRIGHT',
  WARM = 'WARM',
  GOLDEN_HOUR = 'GOLDEN_HOUR',
  NIGHT_LAMP = 'NIGHT_LAMP',
  RAINY = 'RAINY',
}

/** Ambient background sound. */
export enum AmbientSound {
  RAIN = 'RAIN',
  BIRDS = 'BIRDS',
  FAN = 'FAN',
  COFFEE_MACHINE = 'COFFEE_MACHINE',
  CITY = 'CITY',
  OCEAN = 'OCEAN',
  SILENCE = 'SILENCE',
}

/** Music mood playing in the world. */
export enum Music {
  CALM = 'CALM',
  LOFI = 'LOFI',
  UPBEAT = 'UPBEAT',
  ROMANTIC = 'ROMANTIC',
  FOCUS = 'FOCUS',
  AMBIENT = 'AMBIENT',
  NONE = 'NONE',
}

// ---------------------------------------------------------------------------
// House state sub-enums
//
// The house state is a structured snapshot of the companion's living space.
// Each element is a small closed enum so the house reads as data, not strings.
// ---------------------------------------------------------------------------

/** Binary open/closed state, used for curtains and doors. */
export enum Openable {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

/** Binary on/off state, used for TV, music, lights. */
export enum Toggle {
  ON = 'ON',
  OFF = 'OFF',
}

/** Condition of house plants. */
export enum PlantState {
  THRIVING = 'THRIVING',
  WATERED = 'WATERED',
  NEUTRAL = 'NEUTRAL',
  WILTING = 'WILTING',
}

/** Whether the kitchen is actively in use. */
export enum KitchenState {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
}
