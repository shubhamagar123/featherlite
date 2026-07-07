/**
 * OutfitSelector — chooses the outfit from activity + scene + mode.
 *
 * Outfit is mostly rule-driven (gym clothes for the gym, festival wear for
 * special moments) with a small deterministic tie-break where more than one
 * outfit is plausible.
 */

import { Activity, Outfit, Scene, WorldMode } from '../enums/world.enums';
import { IOutfitSelector, IOutfitSelectorInput } from '../interfaces/selectors.interface';
import { WeightedOption } from '../utils/seed.util';

/** Scenes that count as "at home". */
const HOME_SCENES = new Set<Scene>([
  Scene.LIVING_ROOM,
  Scene.KITCHEN,
  Scene.STUDY,
  Scene.BALCONY,
]);

export class OutfitSelector implements IOutfitSelector {
  select(input: IOutfitSelectorInput): Outfit {
    // Hard rules first — these dominate everything else.
    if (input.activity === Activity.GYM) {
      return Outfit.GYM;
    }

    if (input.mode === WorldMode.SPECIAL_MOMENT) {
      return Outfit.FESTIVAL;
    }

    if (input.scene === Scene.DRIVE) {
      return Outfit.TRAVEL;
    }

    // Working: office wear when out, home wear when working from home.
    if (input.activity === Activity.WORKING) {
      return HOME_SCENES.has(input.scene) ? Outfit.HOME_WEAR : Outfit.OFFICE;
    }

    // At-home scenes default to home wear.
    if (HOME_SCENES.has(input.scene)) {
      return Outfit.HOME_WEAR;
    }

    // Out-and-about (cafe/park/pool): casual, with a small chance of travel/office.
    const options: WeightedOption<Outfit>[] = [
      { value: Outfit.CASUAL, weight: 70 },
      { value: Outfit.TRAVEL, weight: 20 },
      { value: Outfit.OFFICE, weight: 10 },
    ];

    return input.context.rngFor('outfit').weightedPick(options);
  }
}
