/**
 * AmbientSelector — chooses ambient sound from weather + scene.
 *
 * Weather wins first (rain you can hear), then the scene supplies its signature
 * soundscape. Where a scene has more than one plausible ambience, a small
 * deterministic tie-break decides.
 */

import { AmbientSound, Scene, Weather } from '../enums/world.enums';
import { IAmbientSelector, IAmbientSelectorInput } from '../interfaces/selectors.interface';
import { WeightedOption } from '../utils/seed.util';

const SCENE_AMBIENCE: Record<Scene, WeightedOption<AmbientSound>[]> = {
  [Scene.PARK]: [
    { value: AmbientSound.BIRDS, weight: 70 },
    { value: AmbientSound.CITY, weight: 30 },
  ],
  [Scene.CAFE]: [
    { value: AmbientSound.COFFEE_MACHINE, weight: 60 },
    { value: AmbientSound.CITY, weight: 40 },
  ],
  [Scene.POOL]: [
    { value: AmbientSound.OCEAN, weight: 75 },
    { value: AmbientSound.BIRDS, weight: 25 },
  ],
  [Scene.DRIVE]: [{ value: AmbientSound.CITY, weight: 100 }],
  [Scene.STUDY]: [
    { value: AmbientSound.FAN, weight: 55 },
    { value: AmbientSound.SILENCE, weight: 45 },
  ],
  [Scene.KITCHEN]: [
    { value: AmbientSound.COFFEE_MACHINE, weight: 55 },
    { value: AmbientSound.FAN, weight: 45 },
  ],
  [Scene.LIVING_ROOM]: [
    { value: AmbientSound.FAN, weight: 40 },
    { value: AmbientSound.SILENCE, weight: 35 },
    { value: AmbientSound.CITY, weight: 25 },
  ],
  [Scene.BALCONY]: [
    { value: AmbientSound.BIRDS, weight: 55 },
    { value: AmbientSound.CITY, weight: 45 },
  ],
};

export class AmbientSelector implements IAmbientSelector {
  select(input: IAmbientSelectorInput): AmbientSound {
    // Audible weather takes precedence.
    if (input.weather === Weather.RAIN || input.weather === Weather.STORM) {
      return AmbientSound.RAIN;
    }

    const options = SCENE_AMBIENCE[input.scene];
    return input.context.rngFor('ambient').weightedPick(options);
  }
}
