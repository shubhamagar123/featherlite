/**
 * GestureManager — resolves the companion's body gesture.
 *
 * The life-state dictates the core gesture (working ⇒ use laptop, cooking ⇒
 * cook); the location and time of day add small nudges (a balcony invites
 * looking outside, mornings invite coffee). Deterministic, salted tie-break.
 */

import { TimeOfDay, type WeightedOption } from '@engines/world';
import { CompanionLocation, CompanionState, Gesture } from '../enums/companion.enums';
import { IGestureInput, IGestureManager } from '../interfaces/managers.interface';

const STATE_GESTURES: Record<CompanionState, Partial<Record<Gesture, number>>> = {
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
};

/** States relaxed enough to be nudged toward coffee / looking outside. */
const LEISURELY = new Set<CompanionState>([
  CompanionState.IDLE,
  CompanionState.RELAXING,
]);

export class GestureManager implements IGestureManager {
  resolve(input: IGestureInput): Gesture {
    const { context, state, location } = input;
    const weights: Partial<Record<Gesture, number>> = { ...STATE_GESTURES[state] };
    const add = (gesture: Gesture, amount: number): void => {
      weights[gesture] = (weights[gesture] ?? 0) + amount;
    };

    // Location nudges.
    if (
      (location === CompanionLocation.BALCONY || location === CompanionLocation.GARDEN) &&
      LEISURELY.has(state)
    ) {
      add(Gesture.LOOK_OUTSIDE, 25);
    }
    if (location === CompanionLocation.GYM) {
      add(Gesture.STRETCH, 30);
    }
    if (
      (location === CompanionLocation.KITCHEN ||
        location === CompanionLocation.CAFE ||
        location === CompanionLocation.BALCONY) &&
      LEISURELY.has(state)
    ) {
      add(Gesture.DRINK_COFFEE, 25);
    }

    // A leisurely morning invites coffee.
    if (context.timeOfDay === TimeOfDay.MORNING && LEISURELY.has(state)) {
      add(Gesture.DRINK_COFFEE, 15);
    }

    const options: WeightedOption<Gesture>[] = (Object.keys(weights) as Gesture[]).map((g) => ({
      value: g,
      weight: weights[g] ?? 0,
    }));

    return context.rngFor('gesture').weightedPick(options);
  }
}
