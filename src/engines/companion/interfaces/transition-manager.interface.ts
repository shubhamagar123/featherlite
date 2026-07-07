/**
 * CompanionTransitionManager contract.
 *
 * Because life-state is recomputed deterministically each call, the transition
 * manager smooths movement between a previously observed state and a freshly
 * resolved one: it validates the jump against the state machine and, when the
 * jump is not direct, reports the next legal step toward the target.
 */

import { CompanionState } from '../enums/companion.enums';
import { CompanionTransitionDTO } from '../dtos/companion.dtos';

export interface ICompanionTransitionManager {
  /**
   * Plan a transition from `from` to `to`.
   *
   * @param from - Previously observed state.
   * @param to - Newly resolved target state.
   */
  plan(from: CompanionState, to: CompanionState): CompanionTransitionDTO;
}
