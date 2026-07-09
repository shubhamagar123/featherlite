/**
 * LocationManager — resolves where the companion is.
 *
 * Location is primarily driven by the companion's life-state (cooking ⇒ kitchen,
 * working ⇒ study), then *synchronized* with the world by boosting the location
 * the world scene maps to, and finally constrained by weather (confining weather
 * suppresses open-air spots). Deterministic, with a salted tie-break.
 */

import { Result, IResult } from '@services/types/result.type';
import { Weather, type WeightedOption } from '@engines/shared';
import { CompanionLocation, CompanionState } from '../enums/companion.enums';
import { ILocationInput, ILocationManager, ICompanionRules } from '../interfaces/managers.interface';
import { DefaultCompanionRules } from '../rules/companion.rules';

const STATE_LOCATIONS: Record<CompanionState, Partial<Record<CompanionLocation, number>>> = {
  [CompanionState.COOKING]: { [CompanionLocation.KITCHEN]: 100 },
  [CompanionState.WORKING]: { [CompanionLocation.STUDY]: 65, [CompanionLocation.CAFE]: 25 },
  [CompanionState.READING]: {
    [CompanionLocation.STUDY]: 35,
    [CompanionLocation.LIVING_ROOM]: 30,
    [CompanionLocation.BALCONY]: 20,
    [CompanionLocation.GARDEN]: 15,
  },
  [CompanionState.RELAXING]: {
    [CompanionLocation.LIVING_ROOM]: 35,
    [CompanionLocation.BALCONY]: 25,
    [CompanionLocation.POOL]: 20,
    [CompanionLocation.GARDEN]: 20,
  },
  [CompanionState.GAMING]: { [CompanionLocation.LIVING_ROOM]: 60, [CompanionLocation.STUDY]: 40 },
  [CompanionState.WALKING]: {
    [CompanionLocation.GARDEN]: 45,
    [CompanionLocation.GYM]: 35,
    [CompanionLocation.CAFE]: 20,
  },
  [CompanionState.DRIVING]: { [CompanionLocation.CAFE]: 100 },
  [CompanionState.SLEEPING]: { [CompanionLocation.LIVING_ROOM]: 100 },
  [CompanionState.BUSY]: {
    [CompanionLocation.STUDY]: 40,
    [CompanionLocation.KITCHEN]: 30,
    [CompanionLocation.LIVING_ROOM]: 30,
  },
  [CompanionState.IDLE]: {
    [CompanionLocation.LIVING_ROOM]: 40,
    [CompanionLocation.BALCONY]: 25,
    [CompanionLocation.KITCHEN]: 20,
    [CompanionLocation.GARDEN]: 15,
  },
};

/** Open-air locations suppressed by confining weather. */
const OUTDOOR = new Set<CompanionLocation>([
  CompanionLocation.BALCONY,
  CompanionLocation.POOL,
  CompanionLocation.GARDEN,
]);

export class LocationManager implements ILocationManager {
  constructor(private readonly rules: ICompanionRules = new DefaultCompanionRules()) {}

  resolve(input: ILocationInput): IResult<CompanionLocation> {
    const { context, state } = input;
    const base = { ...STATE_LOCATIONS[state] };

    // Synchronize with the world: boost the location the world scene maps to,
    // if it is a plausible spot for this state.
    const worldLocation = this.rules.mapWorldSceneToLocation(context.world.scene);
    if (base[worldLocation] !== undefined) {
      base[worldLocation]! += 40;
    }

    const confining = this.rules.isConfiningWeather(context.world.weather as Weather);

    const options: WeightedOption<CompanionLocation>[] = [];
    for (const key of Object.keys(base) as CompanionLocation[]) {
      let weight = base[key] ?? 0;
      if (confining && OUTDOOR.has(key)) weight = 0;
      if (weight > 0) options.push({ value: key, weight });
    }

    const location = options.length === 0 ? CompanionLocation.LIVING_ROOM : context.rngFor('location').weightedPick(options);
    return Result.success(location);
  }
}
