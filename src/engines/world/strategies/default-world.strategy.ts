/**
 * DefaultWorldStrategy — the canonical 70-20-10 rule set.
 *
 * WorldMode distribution (deterministic per companion/day):
 *   - 70%  HOME
 *   - 20%  DAILY_LIFE
 *   - 10%  SPECIAL_MOMENT
 *
 * The mode is resolved by drawing a single deterministic value from the day's
 * `world-mode` sub-stream and bucketing it. Because the value is derived from
 * the stable seed, a given companion/day always lands in the same bucket, yet
 * across many days the buckets fill to the 70/20/10 proportions.
 *
 * The strategy also owns the concrete facet selectors. Swapping a selector (or
 * the whole strategy) lets the rules evolve without changing the builder or
 * engine.
 */

import { WorldMode } from '../enums/world.enums';
import { WorldContext } from '../context/world-context';
import { IWorldStrategy } from '../interfaces/world-strategy.interface';
import {
  IActivitySelector,
  IAmbientSelector,
  IHouseStateSelector,
  ILightingSelector,
  IMusicSelector,
  IOutfitSelector,
  ISceneSelector,
  IWeatherSelector,
} from '../interfaces/selectors.interface';
import { WeatherSelector } from '../selectors/weather.selector';
import { SceneSelector } from '../selectors/scene.selector';
import { ActivitySelector } from '../selectors/activity.selector';
import { OutfitSelector } from '../selectors/outfit.selector';
import { LightingSelector } from '../selectors/lighting.selector';
import { AmbientSelector } from '../selectors/ambient.selector';
import { MusicSelector } from '../selectors/music.selector';
import { HouseStateSelector } from '../selectors/house-state.selector';

/** Cumulative thresholds implementing the 70-20-10 split. */
const HOME_THRESHOLD = 0.7;
const DAILY_LIFE_THRESHOLD = 0.9; // 0.70 + 0.20

/** Optional overrides so callers/tests can inject alternative selectors. */
export interface DefaultWorldStrategyDeps {
  weatherSelector?: IWeatherSelector;
  sceneSelector?: ISceneSelector;
  activitySelector?: IActivitySelector;
  outfitSelector?: IOutfitSelector;
  lightingSelector?: ILightingSelector;
  ambientSelector?: IAmbientSelector;
  musicSelector?: IMusicSelector;
  houseStateSelector?: IHouseStateSelector;
}

export class DefaultWorldStrategy implements IWorldStrategy {
  readonly name = 'default-70-20-10';

  readonly weatherSelector: IWeatherSelector;
  readonly sceneSelector: ISceneSelector;
  readonly activitySelector: IActivitySelector;
  readonly outfitSelector: IOutfitSelector;
  readonly lightingSelector: ILightingSelector;
  readonly ambientSelector: IAmbientSelector;
  readonly musicSelector: IMusicSelector;
  readonly houseStateSelector: IHouseStateSelector;

  constructor(deps: DefaultWorldStrategyDeps = {}) {
    this.weatherSelector = deps.weatherSelector ?? new WeatherSelector();
    this.sceneSelector = deps.sceneSelector ?? new SceneSelector();
    this.activitySelector = deps.activitySelector ?? new ActivitySelector();
    this.outfitSelector = deps.outfitSelector ?? new OutfitSelector();
    this.lightingSelector = deps.lightingSelector ?? new LightingSelector();
    this.ambientSelector = deps.ambientSelector ?? new AmbientSelector();
    this.musicSelector = deps.musicSelector ?? new MusicSelector();
    this.houseStateSelector = deps.houseStateSelector ?? new HouseStateSelector();
  }

  resolveMode(context: WorldContext): WorldMode {
    const roll = context.rngFor('world-mode').next();
    if (roll < HOME_THRESHOLD) return WorldMode.HOME;
    if (roll < DAILY_LIFE_THRESHOLD) return WorldMode.DAILY_LIFE;
    return WorldMode.SPECIAL_MOMENT;
  }
}
