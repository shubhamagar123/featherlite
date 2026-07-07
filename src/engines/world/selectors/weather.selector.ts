/**
 * WeatherSelector — chooses the day's weather, weighted by season.
 *
 * Deterministic: the choice comes from the context's `weather` sub-stream, so a
 * given companion/day always yields the same weather, while the seasonal
 * weights shape the long-run distribution.
 */

import { Season, Weather } from '../enums/world.enums';
import { IWeatherSelector, WeatherSelectionInput } from '../interfaces/selectors.interface';
import { WeightedOption } from '../utils/seed.util';

type WeatherWeights = Record<Weather, number>;

/** Seasonal weather weight tables. Values are relative, not percentages. */
const SEASON_WEATHER: Record<Season, WeatherWeights> = {
  [Season.SPRING]: {
    [Weather.SUNNY]: 35,
    [Weather.CLOUDY]: 25,
    [Weather.RAIN]: 20,
    [Weather.WINDY]: 10,
    [Weather.FOG]: 7,
    [Weather.STORM]: 3,
  },
  [Season.SUMMER]: {
    [Weather.SUNNY]: 50,
    [Weather.CLOUDY]: 20,
    [Weather.RAIN]: 12,
    [Weather.STORM]: 8,
    [Weather.WINDY]: 7,
    [Weather.FOG]: 3,
  },
  [Season.AUTUMN]: {
    [Weather.CLOUDY]: 30,
    [Weather.SUNNY]: 25,
    [Weather.RAIN]: 20,
    [Weather.WINDY]: 12,
    [Weather.FOG]: 10,
    [Weather.STORM]: 3,
  },
  [Season.WINTER]: {
    [Weather.CLOUDY]: 30,
    [Weather.FOG]: 22,
    [Weather.SUNNY]: 18,
    [Weather.RAIN]: 15,
    [Weather.WINDY]: 10,
    [Weather.STORM]: 5,
  },
};

export class WeatherSelector implements IWeatherSelector {
  select(input: WeatherSelectionInput): Weather {
    const weights = SEASON_WEATHER[input.season];
    const options: WeightedOption<Weather>[] = (Object.keys(weights) as Weather[]).map((value) => ({
      value,
      weight: weights[value],
    }));

    return input.context.rngFor('weather').weightedPick(options);
  }
}
