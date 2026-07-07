/**
 * WorldStrategy contract.
 *
 * A strategy encodes the high-level "shape" of a day. Its primary job is to
 * resolve the WorldMode according to the 70-20-10 rule, but it also bundles the
 * full set of facet selectors so an alternative strategy can swap any subset of
 * rules coherently. The builder consumes a strategy; the factory wires the
 * default one.
 */

import { WorldMode } from '../enums/world.enums';
import { WorldContext } from '../context/world-context';
import {
  IActivitySelector,
  IAmbientSelector,
  IHouseStateSelector,
  ILightingSelector,
  IMusicSelector,
  IOutfitSelector,
  ISceneSelector,
  IWeatherSelector,
} from './selectors.interface';

export interface IWorldStrategy {
  /** Stable identifier of the strategy (for logging / experimentation). */
  readonly name: string;

  /**
   * Resolve the day's WorldMode. Implementations must be deterministic for a
   * given context (no `Math.random()`).
   */
  resolveMode(context: WorldContext): WorldMode;

  /** Facet selectors this strategy uses. */
  readonly weatherSelector: IWeatherSelector;
  readonly sceneSelector: ISceneSelector;
  readonly activitySelector: IActivitySelector;
  readonly outfitSelector: IOutfitSelector;
  readonly lightingSelector: ILightingSelector;
  readonly ambientSelector: IAmbientSelector;
  readonly musicSelector: IMusicSelector;
  readonly houseStateSelector: IHouseStateSelector;
}
