/**
 * CompanionStateMachine contract.
 *
 * The state machine defines which life-states exist, which transitions between
 * them are legal, and how to resolve the "intended" state for a context given
 * the active schedule block. It is pure and deterministic.
 */

import { CompanionState } from '../enums/companion.enums';
import { CompanionContext } from '../context/companion-context';
import { CompanionScheduleBlockDTO } from '../dtos/companion.dtos';

export interface ICompanionStateMachine {
  /** All states the machine recognizes. */
  readonly states: readonly CompanionState[];

  /** Whether a direct transition from -> to is allowed. */
  canTransition(from: CompanionState, to: CompanionState): boolean;

  /** Neighbouring states directly reachable from `state`. */
  neighbours(state: CompanionState): readonly CompanionState[];

  /**
   * Shortest legal path from -> to (inclusive). Returns `[from]` when equal and
   * `[]` when unreachable (should not happen for a connected graph).
   */
  shortestPath(from: CompanionState, to: CompanionState): CompanionState[];

  /**
   * Resolve the intended life-state for a context, reconciling the active
   * schedule block with the synchronized world (weather/time constraints).
   */
  resolveState(context: CompanionContext, block: CompanionScheduleBlockDTO | null): CompanionState;
}
