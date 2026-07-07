/**
 * CompanionTransitionManager — smooths movement between life-states.
 *
 * Life-state is recomputed deterministically on every call, so a companion
 * observed WORKING a moment ago might resolve to DRIVING now. Jumping straight
 * there would look unnatural, so this manager consults the state machine: if the
 * target is directly reachable it is returned as-is; otherwise the *next legal
 * step* along the shortest path is returned, letting the companion move one
 * believable hop at a time.
 */

import { CompanionState } from '../enums/companion.enums';
import { CompanionTransitionDTO } from '../dtos/companion.dtos';
import { ICompanionStateMachine } from '../interfaces/state-machine.interface';
import { ICompanionTransitionManager } from '../interfaces/transition-manager.interface';
import { CompanionStateMachine } from '../state/companion-state-machine';

export class CompanionTransitionManager implements ICompanionTransitionManager {
  constructor(private readonly stateMachine: ICompanionStateMachine = new CompanionStateMachine()) {}

  plan(from: CompanionState, to: CompanionState): CompanionTransitionDTO {
    if (from === to) {
      return { from, to, direct: true, next: to, path: [from] };
    }

    const direct = this.stateMachine.canTransition(from, to);
    if (direct) {
      return { from, to, direct: true, next: to, path: [from, to] };
    }

    const path = this.stateMachine.shortestPath(from, to);
    // path is [from, ..., to]; the next hop is index 1 (guaranteed for a
    // connected graph). Fall back to the target if somehow unreachable.
    const next = path.length > 1 ? path[1]! : to;
    return { from, to, direct: false, next, path };
  }
}
