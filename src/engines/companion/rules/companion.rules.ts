/**
 * DefaultCompanionRules — the data-driven policy at the heart of the engine.
 *
 * It owns the *world synchronization* mappings (world activity -> life state,
 * world scene -> location) and derives mood from the environment + the
 * companion's own personality. Keeping this as rules (tables + small pure
 * functions) means a companion's "feel" comes from its seed-defined personality,
 * and the general policy can evolve without rewriting the managers.
 *
 * Nothing here is random in the uncontrolled sense: mood uses a single
 * deterministic salted draw over personality-weighted candidates.
 */

import { Scene, TimeOfDay, Weather, type WeightedOption } from '@engines/world';
import { CompanionLocation, CompanionMood, CompanionState, Chronotype } from '../enums/companion.enums';
import { ICompanionRules, IMoodInput } from '../interfaces/managers.interface';

/** World activity string -> companion life-state. */
const ACTIVITY_TO_STATE: Record<string, CompanionState> = {
  READING: CompanionState.READING,
  COOKING: CompanionState.COOKING,
  WORKING: CompanionState.WORKING,
  GAMING: CompanionState.GAMING,
  WATCHING_TV: CompanionState.RELAXING,
  COFFEE: CompanionState.RELAXING,
  WALKING: CompanionState.WALKING,
  GYM: CompanionState.WALKING,
  CLEANING: CompanionState.BUSY,
  RELAXING: CompanionState.RELAXING,
};

/** World scene -> companion location. */
const SCENE_TO_LOCATION: Record<Scene, CompanionLocation> = {
  [Scene.BALCONY]: CompanionLocation.BALCONY,
  [Scene.LIVING_ROOM]: CompanionLocation.LIVING_ROOM,
  [Scene.KITCHEN]: CompanionLocation.KITCHEN,
  [Scene.STUDY]: CompanionLocation.STUDY,
  [Scene.POOL]: CompanionLocation.POOL,
  [Scene.CAFE]: CompanionLocation.CAFE,
  [Scene.PARK]: CompanionLocation.GARDEN,
  [Scene.DRIVE]: CompanionLocation.CAFE,
};

/** Accumulator helper for mood weighting. */
type MoodWeights = Record<CompanionMood, number>;

function emptyMoodWeights(): MoodWeights {
  return {
    [CompanionMood.CALM]: 0,
    [CompanionMood.PLAYFUL]: 0,
    [CompanionMood.FOCUSED]: 0,
    [CompanionMood.LAZY]: 0,
    [CompanionMood.HAPPY]: 0,
    [CompanionMood.THOUGHTFUL]: 0,
    [CompanionMood.LOW_ENERGY]: 0,
    [CompanionMood.EXCITED]: 0,
  };
}

export class DefaultCompanionRules implements ICompanionRules {
  mapWorldActivityToState(activity: string): CompanionState {
    return ACTIVITY_TO_STATE[activity] ?? CompanionState.IDLE;
  }

  mapWorldSceneToLocation(scene: Scene): CompanionLocation {
    return SCENE_TO_LOCATION[scene] ?? CompanionLocation.LIVING_ROOM;
  }

  isConfiningWeather(weather: Weather): boolean {
    return weather === Weather.STORM || weather === Weather.RAIN;
  }

  deriveMood(input: IMoodInput): CompanionMood {
    const { context, state } = input;

    // Sleeping is unambiguous.
    if (state === CompanionState.SLEEPING) {
      return CompanionMood.LOW_ENERGY;
    }

    const w = emptyMoodWeights();
    const add = (mood: CompanionMood, amount: number): void => {
      w[mood] += Math.max(0, amount);
    };

    this.applyWorldMood(context.world.mood, add);
    this.applyStateMood(state, add);
    this.applyTimeMood(context.timeOfDay, context.profile.preferences.chronotype, add);
    this.applyPersonalityMood(context.profile.preferences.personality, add);
    this.applyAffectionMood(context.signals.affection, add);

    const options: WeightedOption<CompanionMood>[] = (Object.keys(w) as CompanionMood[]).map(
      (mood) => ({ value: mood, weight: w[mood] })
    );

    return context.rngFor('mood').weightedPick(options);
  }

  private applyWorldMood(worldMood: string, add: (m: CompanionMood, n: number) => void): void {
    switch (worldMood) {
      case 'celebratory':
        add(CompanionMood.EXCITED, 60);
        add(CompanionMood.HAPPY, 30);
        add(CompanionMood.PLAYFUL, 20);
        break;
      case 'cozy':
        add(CompanionMood.CALM, 40);
        add(CompanionMood.LAZY, 30);
        add(CompanionMood.LOW_ENERGY, 10);
        break;
      case 'contemplative':
        add(CompanionMood.THOUGHTFUL, 50);
        add(CompanionMood.CALM, 20);
        break;
      case 'fresh':
        add(CompanionMood.HAPPY, 40);
        add(CompanionMood.PLAYFUL, 25);
        add(CompanionMood.EXCITED, 10);
        break;
      case 'warm':
        add(CompanionMood.CALM, 35);
        add(CompanionMood.HAPPY, 30);
        break;
      case 'bright':
        add(CompanionMood.HAPPY, 40);
        add(CompanionMood.PLAYFUL, 25);
        break;
      case 'calm':
        add(CompanionMood.CALM, 40);
        add(CompanionMood.LOW_ENERGY, 20);
        break;
      default: // 'content' and any future tone
        add(CompanionMood.CALM, 30);
        add(CompanionMood.HAPPY, 20);
    }
  }

  private applyStateMood(state: CompanionState, add: (m: CompanionMood, n: number) => void): void {
    switch (state) {
      case CompanionState.WORKING:
        add(CompanionMood.FOCUSED, 45);
        break;
      case CompanionState.READING:
        add(CompanionMood.THOUGHTFUL, 30);
        add(CompanionMood.FOCUSED, 20);
        break;
      case CompanionState.GAMING:
        add(CompanionMood.PLAYFUL, 35);
        add(CompanionMood.EXCITED, 15);
        break;
      case CompanionState.RELAXING:
        add(CompanionMood.LAZY, 30);
        add(CompanionMood.CALM, 25);
        break;
      case CompanionState.COOKING:
        add(CompanionMood.HAPPY, 20);
        add(CompanionMood.FOCUSED, 15);
        break;
      case CompanionState.WALKING:
        add(CompanionMood.HAPPY, 20);
        add(CompanionMood.EXCITED, 10);
        break;
      case CompanionState.DRIVING:
        add(CompanionMood.FOCUSED, 25);
        add(CompanionMood.CALM, 10);
        break;
      case CompanionState.BUSY:
        add(CompanionMood.FOCUSED, 25);
        add(CompanionMood.LOW_ENERGY, 10);
        break;
      default: // IDLE
        add(CompanionMood.CALM, 20);
    }
  }

  private applyTimeMood(
    timeOfDay: TimeOfDay,
    chronotype: Chronotype,
    add: (m: CompanionMood, n: number) => void
  ): void {
    if (timeOfDay === TimeOfDay.NIGHT) {
      // Night owls stay energized at night; others wind down.
      if (chronotype === Chronotype.NIGHT_OWL) {
        add(CompanionMood.PLAYFUL, 20);
        add(CompanionMood.EXCITED, 10);
      } else {
        add(CompanionMood.LOW_ENERGY, 25);
        add(CompanionMood.CALM, 15);
      }
    } else if (timeOfDay === TimeOfDay.MORNING) {
      if (chronotype === Chronotype.MORNING_PERSON) {
        add(CompanionMood.EXCITED, 20);
        add(CompanionMood.HAPPY, 15);
      } else {
        add(CompanionMood.LOW_ENERGY, 10);
      }
    } else if (timeOfDay === TimeOfDay.EVENING) {
      add(CompanionMood.CALM, 12);
    }
  }

  private applyPersonalityMood(
    personality: { playfulness: number; focus: number; warmth: number; energy: number },
    add: (m: CompanionMood, n: number) => void
  ): void {
    add(CompanionMood.PLAYFUL, personality.playfulness * 40);
    add(CompanionMood.FOCUSED, personality.focus * 30);
    add(CompanionMood.HAPPY, personality.warmth * 20);
    add(CompanionMood.EXCITED, personality.energy * 25);
    add(CompanionMood.LOW_ENERGY, (1 - personality.energy) * 20);
  }

  private applyAffectionMood(
    affection: number | undefined,
    add: (m: CompanionMood, n: number) => void
  ): void {
    if (affection !== undefined && affection > 50) {
      add(CompanionMood.HAPPY, 20);
      add(CompanionMood.PLAYFUL, 10);
    }
  }
}
