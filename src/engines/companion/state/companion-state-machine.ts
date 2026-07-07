/**
 * CompanionStateMachine — the legal graph of life-states and the resolver that
 * picks the intended state for a moment.
 *
 * The adjacency graph encodes believable movement: you generally pass through
 * IDLE or WALKING to change what you are doing (you don't teleport from COOKING
 * straight into DRIVING). This graph powers transition smoothing.
 *
 * `resolveState` reconciles three inputs deterministically:
 *   1. the companion's schedule (their intent for this hour),
 *   2. the synchronized world activity (what the environment is doing),
 *   3. world constraints (confining weather, night sleep windows).
 */

import { TimeOfDay, Weather } from '@engines/world';
import { CompanionState, Chronotype } from '../enums/companion.enums';
import { CompanionContext } from '../context/companion-context';
import { CompanionScheduleBlockDTO } from '../dtos/companion.dtos';
import { ICompanionStateMachine } from '../interfaces/state-machine.interface';
import { ICompanionRules } from '../interfaces/managers.interface';
import { DefaultCompanionRules } from '../rules/companion.rules';

/** Legal direct transitions. Edges are made symmetric at construction. */
const ADJACENCY: Record<CompanionState, CompanionState[]> = {
  [CompanionState.IDLE]: [
    CompanionState.WORKING,
    CompanionState.COOKING,
    CompanionState.READING,
    CompanionState.RELAXING,
    CompanionState.GAMING,
    CompanionState.WALKING,
    CompanionState.BUSY,
    CompanionState.SLEEPING,
  ],
  [CompanionState.WORKING]: [CompanionState.IDLE, CompanionState.WALKING],
  [CompanionState.COOKING]: [CompanionState.IDLE, CompanionState.WALKING],
  [CompanionState.READING]: [CompanionState.IDLE, CompanionState.RELAXING],
  [CompanionState.RELAXING]: [CompanionState.IDLE, CompanionState.READING, CompanionState.GAMING],
  [CompanionState.GAMING]: [CompanionState.IDLE, CompanionState.RELAXING],
  [CompanionState.WALKING]: [
    CompanionState.IDLE,
    CompanionState.DRIVING,
    CompanionState.WORKING,
    CompanionState.COOKING,
    CompanionState.BUSY,
  ],
  // Driving is reached only via walking (you walk to the car first).
  [CompanionState.DRIVING]: [CompanionState.WALKING],
  [CompanionState.SLEEPING]: [CompanionState.IDLE],
  [CompanionState.BUSY]: [CompanionState.IDLE, CompanionState.WALKING],
};

/** States compatible with being outdoors — suppressed by confining weather. */
const OUTDOOR_STATES = new Set<CompanionState>([CompanionState.WALKING, CompanionState.DRIVING]);

export class CompanionStateMachine implements ICompanionStateMachine {
  readonly states: readonly CompanionState[] = Object.values(CompanionState);

  private readonly adjacency: Map<CompanionState, Set<CompanionState>>;

  constructor(private readonly rules: ICompanionRules = new DefaultCompanionRules()) {
    // Build a symmetric adjacency map so paths work in both directions.
    this.adjacency = new Map();
    for (const state of this.states) {
      this.adjacency.set(state, new Set());
    }
    for (const [from, tos] of Object.entries(ADJACENCY) as [CompanionState, CompanionState[]][]) {
      for (const to of tos) {
        this.adjacency.get(from)!.add(to);
        this.adjacency.get(to)!.add(from);
      }
    }
  }

  canTransition(from: CompanionState, to: CompanionState): boolean {
    if (from === to) return true;
    return this.adjacency.get(from)?.has(to) ?? false;
  }

  neighbours(state: CompanionState): readonly CompanionState[] {
    return Array.from(this.adjacency.get(state) ?? []);
  }

  shortestPath(from: CompanionState, to: CompanionState): CompanionState[] {
    if (from === to) return [from];

    // Breadth-first search over the (small) state graph.
    const queue: CompanionState[] = [from];
    const cameFrom = new Map<CompanionState, CompanionState>();
    const visited = new Set<CompanionState>([from]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const next of this.neighbours(current)) {
        if (visited.has(next)) continue;
        visited.add(next);
        cameFrom.set(next, current);
        if (next === to) {
          return this.reconstruct(cameFrom, from, to);
        }
        queue.push(next);
      }
    }
    return [];
  }

  resolveState(context: CompanionContext, block: CompanionScheduleBlockDTO | null): CompanionState {
    // Explicit status override wins outright.
    if (context.signals.statusOverride === 'BUSY') return CompanionState.BUSY;

    const chronotype = context.profile.preferences.chronotype;

    // Sleep window: night for everyone except night owls (who sleep pre-dawn,
    // already covered by their own schedule block).
    const scheduledSleep = block?.state === CompanionState.SLEEPING;
    if (scheduledSleep) return CompanionState.SLEEPING;

    // The schedule expresses the companion's intent for this hour; when there is
    // no block, fall back to synchronizing with what the world is doing.
    const intended =
      block?.state ?? this.rules.mapWorldActivityToState(context.world.activity);

    // Confining weather pulls outdoor intents back indoors.
    const weather = context.world.weather as Weather;
    if (OUTDOOR_STATES.has(intended) && this.rules.isConfiningWeather(weather)) {
      return CompanionState.RELAXING;
    }

    // A non-night-owl with no schedule at deep night defaults to sleeping.
    if (
      block === null &&
      context.timeOfDay === TimeOfDay.NIGHT &&
      chronotype !== Chronotype.NIGHT_OWL
    ) {
      return CompanionState.SLEEPING;
    }

    return intended;
  }

  private reconstruct(
    cameFrom: Map<CompanionState, CompanionState>,
    from: CompanionState,
    to: CompanionState
  ): CompanionState[] {
    const path: CompanionState[] = [to];
    let cursor = to;
    while (cursor !== from) {
      const prev = cameFrom.get(cursor)!;
      path.unshift(prev);
      cursor = prev;
    }
    return path;
  }
}
