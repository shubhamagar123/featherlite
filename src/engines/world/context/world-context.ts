/**
 * WorldContext — the immutable input passed to every strategy and selector.
 *
 * It resolves identity + instant + timezone into the derived facts generation
 * needs (local date key, hour, time of day, season) and exposes a deterministic
 * randomness factory keyed off a stable per-day seed.
 */

import { Season, TimeOfDay } from '../enums/world.enums';
import { WorldSignals, GenerateWorldOptions } from '../dtos/world-generation.dto';
import { Clock } from '../utils/clock.util';
import {
  deriveSeason,
  deriveTimeOfDay,
  getLocalDateKey,
  getLocalDateParts,
} from '../utils/date.util';
import { DeterministicRandom, fnv1a } from '../utils/seed.util';

export class WorldContext {
  readonly companionId: string;
  readonly referenceDate: Date;
  readonly timezone: string;
  readonly dateKey: string;
  readonly localHour: number;
  readonly timeOfDay: TimeOfDay;
  readonly season: Season;
  readonly signals: WorldSignals;

  /** Stable seed for this companion + day; base for all salted sub-streams. */
  readonly seed: number;

  private constructor(params: {
    companionId: string;
    referenceDate: Date;
    timezone: string;
    dateKey: string;
    localHour: number;
    timeOfDay: TimeOfDay;
    season: Season;
    signals: WorldSignals;
    seed: number;
  }) {
    this.companionId = params.companionId;
    this.referenceDate = params.referenceDate;
    this.timezone = params.timezone;
    this.dateKey = params.dateKey;
    this.localHour = params.localHour;
    this.timeOfDay = params.timeOfDay;
    this.season = params.season;
    this.signals = params.signals;
    this.seed = params.seed;
    Object.freeze(this);
  }

  /**
   * Build a context from generation options, resolving "now" via the clock when
   * no explicit reference date is provided.
   *
   * @param options - Generation options.
   * @param clock - Clock used when `options.referenceDate` is omitted.
   */
  static create(options: GenerateWorldOptions, clock: Clock): WorldContext {
    const referenceDate = options.referenceDate ?? clock.now();
    const timezone = options.timezone ?? 'UTC';
    const parts = getLocalDateParts(referenceDate, timezone);
    const dateKey = getLocalDateKey(referenceDate, timezone);

    return new WorldContext({
      companionId: options.companionId,
      referenceDate,
      timezone,
      dateKey,
      localHour: parts.hour,
      timeOfDay: deriveTimeOfDay(parts.hour),
      season: deriveSeason(parts.month),
      signals: options.signals ?? {},
      // Seed binds identity + local day. Same companion + day => same world.
      seed: fnv1a(`${options.companionId}:${dateKey}`),
    });
  }

  /**
   * Obtain a deterministic, independent random sub-stream for a named concern
   * (e.g. "scene", "weather"). Two different labels never share a stream; the
   * same label always reproduces the same stream for this context.
   *
   * @param salt - Label identifying the concern.
   */
  rngFor(salt: string): DeterministicRandom {
    return DeterministicRandom.fromString(`${salt}:${this.seed}`);
  }
}
