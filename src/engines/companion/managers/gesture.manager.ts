/**
 * GestureManager — resolves the companion's body gesture.
 *
 * The life-state dictates the core gesture (working ⇒ use laptop, cooking ⇒
 * cook); the location and time of day add small nudges (a balcony invites
 * looking outside, mornings invite coffee). Deterministic, salted tie-break.
 */

import { Result, IResult } from '@services/types/result.type';
import { TimeOfDay, type WeightedOption } from '@engines/shared';
import { CompanionLocation, CompanionState, Gesture } from '../enums/companion.enums';
import { IGestureInput, IGestureManager, IGestureWeights } from '../interfaces/managers.interface';

const DEFAULT_GESTURE_WEIGHTS: IGestureWeights = {
  stateWeights: {
    [CompanionState.WORKING]: { [Gesture.USE_LAPTOP]: 90, [Gesture.SIT]: 10 },
    [CompanionState.COOKING]: { [Gesture.COOK]: 100 },
    [CompanionState.READING]: { [Gesture.READ]: 100 },
    [CompanionState.RELAXING]: {
      [Gesture.SIT]: 40,
      [Gesture.LOOK_OUTSIDE]: 35,
      [Gesture.STRETCH]: 25,
    },
    [CompanionState.GAMING]: { [Gesture.SIT]: 70, [Gesture.USE_LAPTOP]: 30 },
    [CompanionState.WALKING]: { [Gesture.WALK]: 100 },
    [CompanionState.DRIVING]: { [Gesture.SIT]: 100 },
    [CompanionState.SLEEPING]: { [Gesture.SIT]: 100 },
    [CompanionState.BUSY]: { [Gesture.STAND]: 40, [Gesture.USE_LAPTOP]: 30, [Gesture.STRETCH]: 30 },
    [CompanionState.IDLE]: {
      [Gesture.STAND]: 30,
      [Gesture.STRETCH]: 25,
      [Gesture.LOOK_OUTSIDE]: 25,
      [Gesture.WAVE]: 20,
    },
  },
  locationNudges: {
    outside: 25,
    gym: 30,
    coffee: 25,
  },
  timeNudges: {
    morningCoffee: 15,
  },
};

/** States relaxed enough to be nudged toward coffee / looking outside. */
const LEISURELY = new Set<CompanionState>([
  CompanionState.IDLE,
  CompanionState.RELAXING,
]);

export class GestureManager implements IGestureManager {
  constructor(private readonly weights: IGestureWeights = DEFAULT_GESTURE_WEIGHTS) {}

  resolve(input: IGestureInput): IResult<Gesture> {
    const { context, state, location } = input;
    const baseWeights = this.weights.stateWeights[state] ?? {};
    const weights: Partial<Record<Gesture, number>> = { ...baseWeights };
    const add = (gesture: Gesture, amount: number): void => {
      weights[gesture] = (weights[gesture] ?? 0) + amount;
    };

    // Location nudges.
    const outdoorLocations = [CompanionLocation.BALCONY, CompanionLocation.GARDEN];
    if (outdoorLocations.includes(location) && LEISURELY.has(state)) {
      add(Gesture.LOOK_OUTSIDE, this.weights.locationNudges?.outside ?? 25);
    }
    if (location === CompanionLocation.GYM) {
      add(Gesture.STRETCH, this.weights.locationNudges?.gym ?? 30);
    }
    const coffeeLocations = [CompanionLocation.KITCHEN, CompanionLocation.CAFE, CompanionLocation.BALCONY];
    if (coffeeLocations.includes(location) && LEISURELY.has(state)) {
      add(Gesture.DRINK_COFFEE, this.weights.locationNudges?.coffee ?? 25);
    }

    // A leisurely morning invites coffee.
    if (context.timeOfDay === TimeOfDay.MORNING && LEISURELY.has(state)) {
      add(Gesture.DRINK_COFFEE, this.weights.timeNudges?.morningCoffee ?? 15);
    }

    const options: WeightedOption<Gesture>[] = (Object.keys(weights) as Gesture[]).map((g) => ({
      value: g,
      weight: weights[g] ?? 0,
    }));

    const gesture = context.rngFor('gesture').weightedPick(options);
    return Result.success(gesture);
  }
}
