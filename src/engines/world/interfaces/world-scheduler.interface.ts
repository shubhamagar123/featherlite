/**
 * WorldScheduler contract.
 *
 * The scheduler owns the "today's world" cadence: knowing when a stored world
 * has aged past the local day boundary and needs regenerating. Its core logic
 * is pure and testable; it drives regeneration only through the engine.
 */

import { IResult } from '@services/types/result.type';
import { GenerateWorldOptions, GeneratedWorldDTO } from '../dtos/world-generation.dto';

export interface IWorldScheduler {
  /**
   * Whether a world generated for `worldDateKey` is stale relative to now.
   *
   * @param worldDateKey - The `YYYY-MM-DD` key the world was generated for.
   * @param timezone - Timezone to evaluate the day boundary in.
   * @param now - Optional reference instant (defaults to the clock).
   */
  isStale(worldDateKey: string, timezone: string, now?: Date): boolean;

  /**
   * The instant at which the current local day's world expires (next local
   * midnight).
   *
   * @param timezone - Timezone to evaluate.
   * @param now - Optional reference instant (defaults to the clock).
   */
  nextRefreshAt(timezone: string, now?: Date): Date;

  /**
   * Ensure a fresh world exists for the companion: regenerate if stale/absent,
   * otherwise return the current one.
   */
  ensureFreshWorld(
    options: GenerateWorldOptions,
    lastKnownDateKey?: string
  ): Promise<IResult<GeneratedWorldDTO>>;
}
