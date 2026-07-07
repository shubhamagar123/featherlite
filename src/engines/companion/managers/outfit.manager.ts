/**
 * OutfitManager — resolves what the companion is wearing.
 *
 * The baseline is *synchronized* from the world's outfit (the world already
 * reasons about weather + occasion), then refined by hard, explainable rules for
 * the companion's own state and location. Almost entirely rule-driven.
 */

import { Outfit as WorldOutfit, WorldMode } from '@engines/world';
import { CompanionLocation, CompanionOutfit, CompanionState } from '../enums/companion.enums';
import { IOutfitInput, IOutfitManager } from '../interfaces/managers.interface';

/** World outfit -> companion outfit (near 1:1). */
const WORLD_OUTFIT: Record<WorldOutfit, CompanionOutfit> = {
  [WorldOutfit.HOME_WEAR]: CompanionOutfit.HOME,
  [WorldOutfit.CASUAL]: CompanionOutfit.CASUAL,
  [WorldOutfit.OFFICE]: CompanionOutfit.OFFICE,
  [WorldOutfit.GYM]: CompanionOutfit.GYM,
  [WorldOutfit.TRAVEL]: CompanionOutfit.TRAVEL,
  [WorldOutfit.FESTIVAL]: CompanionOutfit.FESTIVAL,
};

/** Locations considered "at home" for outfit purposes. */
const HOME_LOCATIONS = new Set<CompanionLocation>([
  CompanionLocation.LIVING_ROOM,
  CompanionLocation.KITCHEN,
  CompanionLocation.STUDY,
  CompanionLocation.BALCONY,
  CompanionLocation.GARDEN,
  CompanionLocation.POOL,
]);

/** States where being at home implies home wear. */
const HOMEBODY_STATES = new Set<CompanionState>([
  CompanionState.IDLE,
  CompanionState.RELAXING,
  CompanionState.READING,
  CompanionState.GAMING,
  CompanionState.COOKING,
  CompanionState.SLEEPING,
]);

export class OutfitManager implements IOutfitManager {
  resolve(input: IOutfitInput): CompanionOutfit {
    const { context, state, location } = input;

    // Hard rules, in priority order.
    if (state === CompanionState.DRIVING) return CompanionOutfit.TRAVEL;
    if (location === CompanionLocation.GYM) return CompanionOutfit.GYM;
    if (context.world.mode === WorldMode.SPECIAL_MOMENT) return CompanionOutfit.FESTIVAL;

    if (state === CompanionState.WORKING) {
      return HOME_LOCATIONS.has(location) ? CompanionOutfit.HOME : CompanionOutfit.OFFICE;
    }
    if (state === CompanionState.SLEEPING) return CompanionOutfit.HOME;

    // At home and taking it easy => home wear regardless of world casual.
    if (HOME_LOCATIONS.has(location) && HOMEBODY_STATES.has(state)) {
      return CompanionOutfit.HOME;
    }

    // Otherwise synchronize with the world's outfit choice.
    return WORLD_OUTFIT[context.world.outfit] ?? CompanionOutfit.CASUAL;
  }
}
