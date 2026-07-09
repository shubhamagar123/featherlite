/**
 * Shared kernel enumerations used across multiple engines.
 *
 * These enums represent cross-engine domain concepts:
 * - TimeOfDay: Coarse periods of the day (world, companion)
 * - Weather: Meteorological conditions (world, companion, notifications)
 * - Scene: Location/scene in the world (world, companion)
 * - WorldMode: Macro world generation strategy (world, companion)
 */

/** Coarse period of the day, derived deterministically from the local clock. */
export enum TimeOfDay {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

/** Weather condition for the world. */
export enum Weather {
  SUNNY = 'SUNNY',
  CLOUDY = 'CLOUDY',
  RAIN = 'RAIN',
  STORM = 'STORM',
  FOG = 'FOG',
  WINDY = 'WINDY',
}

/** Scene / location the companion currently occupies. */
export enum Scene {
  BALCONY = 'BALCONY',
  LIVING_ROOM = 'LIVING_ROOM',
  KITCHEN = 'KITCHEN',
  STUDY = 'STUDY',
  POOL = 'POOL',
  CAFE = 'CAFE',
  PARK = 'PARK',
  DRIVE = 'DRIVE',
}

/**
 * WorldMode drives the 70-20-10 generation rule.
 *
 * - HOME (70%): the companion is at home living an ordinary domestic day.
 * - DAILY_LIFE (20%): the companion is out doing everyday things (cafe, park, drive).
 * - SPECIAL_MOMENT (10%): a rarer, heightened, celebratory day.
 */
export enum WorldMode {
  HOME = 'HOME',
  DAILY_LIFE = 'DAILY_LIFE',
  SPECIAL_MOMENT = 'SPECIAL_MOMENT',
}
