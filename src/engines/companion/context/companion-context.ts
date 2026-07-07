/**
 * CompanionContext — the immutable input to every manager and the state machine.
 *
 * It binds a companion's profile to a specific world + instant, resolves the
 * local hour needed for schedule lookups, and exposes a deterministic salted
 * randomness factory (reused from the World Engine) for tie-breaks only.
 */

import {
  DeterministicRandom,
  fnv1a,
  getLocalDateParts,
  type Clock,
  type GeneratedWorldDTO,
  type TimeOfDay,
} from '@engines/world';

import { CompanionProfileDTO, CompanionSignals, ResolveCompanionOptions } from '../dtos/companion.dtos';

export class CompanionContext {
  readonly profile: CompanionProfileDTO;
  readonly world: GeneratedWorldDTO;
  readonly referenceDate: Date;
  readonly timezone: string;
  readonly localHour: number;
  readonly timeOfDay: TimeOfDay;
  readonly signals: CompanionSignals;
  readonly seed: number;

  private constructor(params: {
    profile: CompanionProfileDTO;
    world: GeneratedWorldDTO;
    referenceDate: Date;
    timezone: string;
    localHour: number;
    timeOfDay: TimeOfDay;
    signals: CompanionSignals;
    seed: number;
  }) {
    this.profile = params.profile;
    this.world = params.world;
    this.referenceDate = params.referenceDate;
    this.timezone = params.timezone;
    this.localHour = params.localHour;
    this.timeOfDay = params.timeOfDay;
    this.signals = params.signals;
    this.seed = params.seed;
    Object.freeze(this);
  }

  /**
   * Build a context from a profile, a synchronized world, and options.
   *
   * Timezone precedence: explicit option -> companion schedule tz -> world tz.
   * The world already carries the resolved `timeOfDay`, so the companion stays
   * in lock-step with its environment.
   */
  static create(
    profile: CompanionProfileDTO,
    world: GeneratedWorldDTO,
    options: ResolveCompanionOptions,
    clock: Clock
  ): CompanionContext {
    const referenceDate = options.referenceDate ?? clock.now();
    const timezone =
      options.timezone ?? profile.schedule.timezone ?? world.timezone ?? 'UTC';
    const parts = getLocalDateParts(referenceDate, timezone);

    return new CompanionContext({
      profile,
      world,
      referenceDate,
      timezone,
      localHour: parts.hour,
      timeOfDay: world.timeOfDay,
      signals: options.signals ?? {},
      // Companion-scoped seed: identity + world seed keeps life-state stable for
      // a given companion/day yet distinct per companion sharing a world.
      seed: fnv1a(`companion:${profile.id}:${world.seed}`),
    });
  }

  /** Deterministic, independent sub-stream for a named facet (tie-breaks only). */
  rngFor(salt: string): DeterministicRandom {
    return DeterministicRandom.fromString(`${salt}:${this.seed}`);
  }
}
