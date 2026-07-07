/**
 * Companion Engine domain enumerations.
 *
 * These describe the *life* of a companion — what they are doing, how they feel,
 * how they look — never anything about AI conversations. Every value the engine
 * can resolve is a member of one of these closed enums.
 */

/** High-level activity the companion is currently engaged in. */
export enum CompanionState {
  IDLE = 'IDLE',
  WORKING = 'WORKING',
  COOKING = 'COOKING',
  READING = 'READING',
  RELAXING = 'RELAXING',
  GAMING = 'GAMING',
  WALKING = 'WALKING',
  DRIVING = 'DRIVING',
  SLEEPING = 'SLEEPING',
  BUSY = 'BUSY',
}

/** Emotional tone of the companion. */
export enum CompanionMood {
  CALM = 'CALM',
  PLAYFUL = 'PLAYFUL',
  FOCUSED = 'FOCUSED',
  LAZY = 'LAZY',
  HAPPY = 'HAPPY',
  THOUGHTFUL = 'THOUGHTFUL',
  LOW_ENERGY = 'LOW_ENERGY',
  EXCITED = 'EXCITED',
}

/** Facial expression. */
export enum Expression {
  SMILE = 'SMILE',
  LAUGH = 'LAUGH',
  THINKING = 'THINKING',
  LISTENING = 'LISTENING',
  CONCERNED = 'CONCERNED',
  NEUTRAL = 'NEUTRAL',
  EYE_ROLL = 'EYE_ROLL',
  SLEEPY = 'SLEEPY',
  CURIOUS = 'CURIOUS',
}

/** Body gesture / animation. */
export enum Gesture {
  WAVE = 'WAVE',
  SIT = 'SIT',
  STAND = 'STAND',
  WALK = 'WALK',
  DRINK_COFFEE = 'DRINK_COFFEE',
  COOK = 'COOK',
  READ = 'READ',
  STRETCH = 'STRETCH',
  LOOK_OUTSIDE = 'LOOK_OUTSIDE',
  USE_LAPTOP = 'USE_LAPTOP',
}

/** Where the companion currently is. */
export enum CompanionLocation {
  BALCONY = 'BALCONY',
  LIVING_ROOM = 'LIVING_ROOM',
  KITCHEN = 'KITCHEN',
  STUDY = 'STUDY',
  CAFE = 'CAFE',
  GYM = 'GYM',
  GARDEN = 'GARDEN',
  POOL = 'POOL',
}

/** What the companion is wearing. */
export enum CompanionOutfit {
  HOME = 'HOME',
  CASUAL = 'CASUAL',
  OFFICE = 'OFFICE',
  GYM = 'GYM',
  FESTIVAL = 'FESTIVAL',
  TRAVEL = 'TRAVEL',
}

/**
 * How reachable the companion is. This is a *life* property (derived from what
 * they are doing) — not a network/presence flag and not about AI replies.
 */
export enum Availability {
  AVAILABLE = 'AVAILABLE',
  LIMITED = 'LIMITED',
  AWAY = 'AWAY',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
  OFFLINE = 'OFFLINE',
}

// ---------------------------------------------------------------------------
// Identity / preference enums (seed-defined, never hardcoded in engine logic)
// ---------------------------------------------------------------------------

export enum Gender {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  NON_BINARY = 'NON_BINARY',
  UNSPECIFIED = 'UNSPECIFIED',
}

export enum AgeRange {
  TEEN = 'TEEN',
  YOUNG_ADULT = 'YOUNG_ADULT',
  ADULT = 'ADULT',
  MATURE = 'MATURE',
}

/** Daily energy rhythm; biases sleep windows and mood. */
export enum Chronotype {
  MORNING_PERSON = 'MORNING_PERSON',
  BALANCED = 'BALANCED',
  NIGHT_OWL = 'NIGHT_OWL',
}
