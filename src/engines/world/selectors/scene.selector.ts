/**
 * SceneSelector — chooses the scene from mode + time of day + weather.
 *
 * Rules (deterministic):
 *  - Each WorldMode has a base scene weighting (HOME favours indoor home
 *    scenes; DAILY_LIFE favours out-and-about scenes; SPECIAL_MOMENT favours
 *    memorable destinations).
 *  - Night pushes strongly toward indoor scenes.
 *  - Rain/Storm/Fog suppress outdoor scenes; Storm forces indoors entirely.
 */

import { Scene, TimeOfDay, Weather, WorldMode } from '../enums/world.enums';
import { ISceneSelector, ISceneSelectorInput } from '../interfaces/selectors.interface';
import { WeightedOption } from '../utils/seed.util';

/** Scenes that are physically indoors / weather-protected. */
const INDOOR_SCENES = new Set<Scene>([
  Scene.LIVING_ROOM,
  Scene.KITCHEN,
  Scene.STUDY,
  Scene.DRIVE, // inside a vehicle — weather-protected
]);

/** Fully exposed outdoor scenes. */
const OUTDOOR_SCENES = new Set<Scene>([Scene.BALCONY, Scene.POOL, Scene.PARK]);

const MODE_BASE: Record<WorldMode, Partial<Record<Scene, number>>> = {
  [WorldMode.HOME]: {
    [Scene.LIVING_ROOM]: 34,
    [Scene.KITCHEN]: 26,
    [Scene.STUDY]: 22,
    [Scene.BALCONY]: 18,
  },
  [WorldMode.DAILY_LIFE]: {
    [Scene.CAFE]: 28,
    [Scene.PARK]: 24,
    [Scene.DRIVE]: 20,
    [Scene.POOL]: 12,
    [Scene.KITCHEN]: 8,
    [Scene.LIVING_ROOM]: 8,
  },
  [WorldMode.SPECIAL_MOMENT]: {
    [Scene.POOL]: 26,
    [Scene.DRIVE]: 24,
    [Scene.PARK]: 22,
    [Scene.CAFE]: 18,
    [Scene.BALCONY]: 10,
  },
};

export class SceneSelector implements ISceneSelector {
  select(input: ISceneSelectorInput): Scene {
    const base = MODE_BASE[input.mode];
    const options: WeightedOption<Scene>[] = [];

    for (const key of Object.keys(base) as Scene[]) {
      let weight = base[key] ?? 0;
      weight = this.applyTimeMultiplier(weight, key, input.timeOfDay);
      weight = this.applyWeatherMultiplier(weight, key, input.weather);
      if (weight > 0) {
        options.push({ value: key, weight });
      }
    }

    // Safety net: if every candidate was suppressed (e.g. an all-outdoor mode
    // during a storm), fall back to a guaranteed indoor scene.
    if (options.length === 0) {
      return Scene.LIVING_ROOM;
    }

    return input.context.rngFor('scene').weightedPick(options);
  }

  private applyTimeMultiplier(weight: number, scene: Scene, timeOfDay: TimeOfDay): number {
    if (timeOfDay === TimeOfDay.NIGHT) {
      if (OUTDOOR_SCENES.has(scene)) return weight * 0.15;
      if (INDOOR_SCENES.has(scene)) return weight * 1.4;
    }
    if (timeOfDay === TimeOfDay.MORNING && scene === Scene.BALCONY) {
      return weight * 1.5; // morning balcony coffee is a signature beat
    }
    return weight;
  }

  private applyWeatherMultiplier(weight: number, scene: Scene, weather: Weather): number {
    if (weather === Weather.STORM) {
      return INDOOR_SCENES.has(scene) ? weight * 1.5 : 0;
    }
    if (weather === Weather.RAIN) {
      if (OUTDOOR_SCENES.has(scene)) return weight * 0.25;
      if (INDOOR_SCENES.has(scene)) return weight * 1.3;
    }
    if (weather === Weather.FOG && OUTDOOR_SCENES.has(scene)) {
      return weight * 0.5;
    }
    if (weather === Weather.SUNNY && OUTDOOR_SCENES.has(scene)) {
      return weight * 1.25;
    }
    return weight;
  }
}
