/**
 * ActivitySelector — chooses the activity from the scene, biased by time of day.
 *
 * Each scene has a plausible set of activities; the time of day nudges the
 * weights (mornings favour coffee/gym/work, nights favour tv/relaxing/gaming).
 * WorldMode gives a mild nudge (special moments lean playful).
 */

import { Activity, Scene, TimeOfDay, WorldMode } from '../enums/world.enums';
import { IActivitySelector, IActivitySelectorInput } from '../interfaces/selectors.interface';
import { WeightedOption } from '../utils/seed.util';

const SCENE_ACTIVITIES: Record<Scene, Partial<Record<Activity, number>>> = {
  [Scene.KITCHEN]: {
    [Activity.COOKING]: 45,
    [Activity.COFFEE]: 30,
    [Activity.CLEANING]: 25,
  },
  [Scene.STUDY]: {
    [Activity.WORKING]: 50,
    [Activity.READING]: 35,
    [Activity.GAMING]: 15,
  },
  [Scene.LIVING_ROOM]: {
    [Activity.WATCHING_TV]: 30,
    [Activity.RELAXING]: 28,
    [Activity.GAMING]: 22,
    [Activity.READING]: 20,
  },
  [Scene.BALCONY]: {
    [Activity.COFFEE]: 40,
    [Activity.RELAXING]: 32,
    [Activity.READING]: 28,
  },
  [Scene.CAFE]: {
    [Activity.COFFEE]: 45,
    [Activity.READING]: 28,
    [Activity.WORKING]: 27,
  },
  [Scene.PARK]: {
    [Activity.WALKING]: 44,
    [Activity.GYM]: 30,
    [Activity.RELAXING]: 26,
  },
  [Scene.POOL]: {
    [Activity.RELAXING]: 55,
    [Activity.GYM]: 45,
  },
  [Scene.DRIVE]: {
    [Activity.RELAXING]: 60,
    [Activity.COFFEE]: 40,
  },
};

export class ActivitySelector implements IActivitySelector {
  select(input: IActivitySelectorInput): Activity {
    const base = SCENE_ACTIVITIES[input.scene];
    const options: WeightedOption<Activity>[] = [];

    for (const key of Object.keys(base) as Activity[]) {
      let weight = base[key] ?? 0;
      weight = this.applyTimeMultiplier(weight, key, input.timeOfDay);
      weight = this.applyModeMultiplier(weight, key, input.mode);
      if (weight > 0) {
        options.push({ value: key, weight });
      }
    }

    if (options.length === 0) {
      return Activity.RELAXING;
    }

    return input.context.rngFor('activity').weightedPick(options);
  }

  private applyTimeMultiplier(weight: number, activity: Activity, timeOfDay: TimeOfDay): number {
    switch (timeOfDay) {
      case TimeOfDay.MORNING:
        if (activity === Activity.COFFEE || activity === Activity.GYM) return weight * 1.6;
        if (activity === Activity.WORKING) return weight * 1.3;
        if (activity === Activity.WATCHING_TV) return weight * 0.5;
        return weight;
      case TimeOfDay.AFTERNOON:
        if (activity === Activity.WORKING || activity === Activity.WALKING) return weight * 1.3;
        return weight;
      case TimeOfDay.EVENING:
        if (activity === Activity.COOKING || activity === Activity.WATCHING_TV) return weight * 1.4;
        if (activity === Activity.WORKING) return weight * 0.7;
        return weight;
      case TimeOfDay.NIGHT:
        if (
          activity === Activity.WATCHING_TV ||
          activity === Activity.RELAXING ||
          activity === Activity.GAMING
        ) {
          return weight * 1.6;
        }
        if (activity === Activity.GYM || activity === Activity.WORKING) return weight * 0.3;
        return weight;
      default:
        return weight;
    }
  }

  private applyModeMultiplier(weight: number, activity: Activity, mode: WorldMode): number {
    if (mode === WorldMode.SPECIAL_MOMENT) {
      if (activity === Activity.RELAXING || activity === Activity.GAMING) return weight * 1.3;
      if (activity === Activity.CLEANING || activity === Activity.WORKING) return weight * 0.5;
    }
    return weight;
  }
}
