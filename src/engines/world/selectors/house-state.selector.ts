/**
 * HouseStateSelector — assembles the structured living-space snapshot.
 *
 * This selector is almost entirely rule-driven (very little randomness): each
 * element of the house is a direct, explainable consequence of the time of day,
 * weather, scene, current activity, and music. It demonstrates that the engine
 * favours deterministic rules over chance.
 */

import {
  Activity,
  KitchenState,
  Lighting,
  Music,
  Openable,
  PlantState,
  Scene,
  TimeOfDay,
  Toggle,
  Weather,
} from '../enums/world.enums';
import { HouseStateDTO } from '../dtos/world-generation.dto';
import {
  IHouseStateSelector,
  IHouseStateSelectorInput,
} from '../interfaces/selectors.interface';

/** Objects highlighted per activity — flavour details for the scene. */
const ACTIVITY_OBJECTS: Record<Activity, string[]> = {
  [Activity.READING]: ['book', 'reading lamp'],
  [Activity.COOKING]: ['cutting board', 'stovetop'],
  [Activity.WORKING]: ['laptop', 'notebook'],
  [Activity.GAMING]: ['controller', 'console'],
  [Activity.WATCHING_TV]: ['remote', 'blanket'],
  [Activity.COFFEE]: ['coffee mug'],
  [Activity.WALKING]: ['sneakers', 'water bottle'],
  [Activity.GYM]: ['dumbbells', 'towel'],
  [Activity.CLEANING]: ['broom', 'cloth'],
  [Activity.RELAXING]: ['cushion', 'candle'],
};

export class HouseStateSelector implements IHouseStateSelector {
  select(input: IHouseStateSelectorInput): HouseStateDTO {
    return {
      curtains: this.resolveCurtains(input.timeOfDay, input.weather),
      doors: this.resolveDoors(input.timeOfDay, input.weather, input.scene),
      tv: this.resolveTv(input.activity),
      music: this.resolveMusic(input.music, input.activity),
      lights: this.resolveLights(input.timeOfDay, input.weather),
      plants: this.resolvePlants(input.timeOfDay, input.weather),
      kitchen: this.resolveKitchen(input.scene, input.activity),
      objects: ACTIVITY_OBJECTS[input.activity] ?? [],
    };
  }

  private resolveCurtains(timeOfDay: TimeOfDay, weather: Weather): Openable {
    if (timeOfDay === TimeOfDay.NIGHT || weather === Weather.STORM) {
      return Openable.CLOSED;
    }
    return Openable.OPEN;
  }

  private resolveDoors(timeOfDay: TimeOfDay, weather: Weather, scene: Scene): Openable {
    const openAirScene = scene === Scene.BALCONY || scene === Scene.PARK || scene === Scene.POOL;
    const pleasant = weather === Weather.SUNNY || weather === Weather.CLOUDY || weather === Weather.WINDY;
    if (openAirScene && pleasant && timeOfDay !== TimeOfDay.NIGHT) {
      return Openable.OPEN;
    }
    return Openable.CLOSED;
  }

  private resolveTv(activity: Activity): Toggle {
    return activity === Activity.WATCHING_TV || activity === Activity.GAMING
      ? Toggle.ON
      : Toggle.OFF;
  }

  private resolveMusic(music: Music, activity: Activity): Toggle {
    if (music === Music.NONE) return Toggle.OFF;
    const musicalActivity =
      activity === Activity.RELAXING ||
      activity === Activity.COFFEE ||
      activity === Activity.COOKING ||
      activity === Activity.READING ||
      activity === Activity.CLEANING;
    return musicalActivity ? Toggle.ON : Toggle.OFF;
  }

  private resolveLights(timeOfDay: TimeOfDay, weather: Weather): Toggle {
    if (timeOfDay === TimeOfDay.NIGHT || timeOfDay === TimeOfDay.EVENING) return Toggle.ON;
    if (weather === Weather.STORM || weather === Weather.FOG) return Toggle.ON;
    return Toggle.OFF;
  }

  private resolvePlants(timeOfDay: TimeOfDay, weather: Weather): PlantState {
    if (weather === Weather.RAIN || weather === Weather.STORM) return PlantState.THRIVING;
    if (timeOfDay === TimeOfDay.MORNING) return PlantState.WATERED;
    if (weather === Weather.FOG) return PlantState.NEUTRAL;
    return PlantState.NEUTRAL;
  }

  private resolveKitchen(scene: Scene, activity: Activity): KitchenState {
    if (scene === Scene.KITCHEN) return KitchenState.ACTIVE;
    if (activity === Activity.COOKING || activity === Activity.COFFEE) return KitchenState.ACTIVE;
    return KitchenState.IDLE;
  }
}

/**
 * Small helper kept exported for potential reuse by future strategies: maps a
 * lighting mood to whether artificial light is implied. Not used internally but
 * documents the intended lighting/house-lights relationship.
 */
export function lightingImpliesLampsOn(lighting: Lighting): boolean {
  return lighting === Lighting.NIGHT_LAMP || lighting === Lighting.RAINY;
}
