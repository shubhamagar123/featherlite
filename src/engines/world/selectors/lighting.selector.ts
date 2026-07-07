/**
 * LightingSelector — chooses lighting from time of day + weather.
 *
 * Weather dominates when it is wet/overcast (RAINY light); otherwise the time
 * of day drives it (bright mornings, golden-hour evenings, night lamps).
 */

import { Lighting, TimeOfDay, Weather } from '../enums/world.enums';
import { ILightingSelector, ILightingSelectorInput } from '../interfaces/selectors.interface';

export class LightingSelector implements ILightingSelector {
  select(input: ILightingSelectorInput): Lighting {
    const { timeOfDay, weather } = input;

    // Wet / heavily overcast weather overrides daytime lighting, except at night
    // where the night lamp still reads best.
    const isWet = weather === Weather.RAIN || weather === Weather.STORM || weather === Weather.FOG;
    if (isWet && timeOfDay !== TimeOfDay.NIGHT) {
      return Lighting.RAINY;
    }

    switch (timeOfDay) {
      case TimeOfDay.MORNING:
        return weather === Weather.CLOUDY ? Lighting.WARM : Lighting.BRIGHT;
      case TimeOfDay.AFTERNOON:
        return Lighting.BRIGHT;
      case TimeOfDay.EVENING:
        return Lighting.GOLDEN_HOUR;
      case TimeOfDay.NIGHT:
      default:
        return Lighting.NIGHT_LAMP;
    }
  }
}
