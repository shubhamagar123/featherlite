/**
 * Selector contracts.
 *
 * Each selector owns exactly one facet of the world and depends only on the
 * facets resolved before it (see the builder's dependency order). Every
 * selector is an interface with a default implementation, so individual rules
 * can be swapped or A/B-tested without touching the rest of the engine.
 */

import {
  Activity,
  AmbientSound,
  Lighting,
  Music,
  Outfit,
  Scene,
  Season,
  TimeOfDay,
  Weather,
  WorldMode,
} from '../enums/world.enums';
import { HouseStateDTO } from '../dtos/world-generation.dto';
import { WorldContext } from '../context/world-context';

export interface WeatherSelectionInput {
  context: WorldContext;
  season: Season;
}

export interface ISceneSelectorInput {
  context: WorldContext;
  mode: WorldMode;
  timeOfDay: TimeOfDay;
  weather: Weather;
}

export interface IActivitySelectorInput {
  context: WorldContext;
  mode: WorldMode;
  timeOfDay: TimeOfDay;
  scene: Scene;
}

export interface IOutfitSelectorInput {
  context: WorldContext;
  mode: WorldMode;
  scene: Scene;
  activity: Activity;
}

export interface ILightingSelectorInput {
  context: WorldContext;
  timeOfDay: TimeOfDay;
  weather: Weather;
}

export interface IAmbientSelectorInput {
  context: WorldContext;
  weather: Weather;
  scene: Scene;
}

export interface IMusicSelectorInput {
  context: WorldContext;
  mode: WorldMode;
  timeOfDay: TimeOfDay;
  activity: Activity;
}

export interface IHouseStateSelectorInput {
  context: WorldContext;
  timeOfDay: TimeOfDay;
  weather: Weather;
  scene: Scene;
  activity: Activity;
  music: Music;
}

export interface IWeatherSelector {
  select(input: WeatherSelectionInput): Weather;
}

export interface ISceneSelector {
  select(input: ISceneSelectorInput): Scene;
}

export interface IActivitySelector {
  select(input: IActivitySelectorInput): Activity;
}

export interface IOutfitSelector {
  select(input: IOutfitSelectorInput): Outfit;
}

export interface ILightingSelector {
  select(input: ILightingSelectorInput): Lighting;
}

export interface IAmbientSelector {
  select(input: IAmbientSelectorInput): AmbientSound;
}

export interface IMusicSelector {
  select(input: IMusicSelectorInput): Music;
}

export interface IHouseStateSelector {
  select(input: IHouseStateSelectorInput): HouseStateDTO;
}
