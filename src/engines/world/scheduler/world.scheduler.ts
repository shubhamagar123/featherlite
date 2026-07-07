/**
 * WorldScheduler — owns the "today's world" cadence.
 *
 * Worlds are anchored to a local day. When the local day rolls over, the stored
 * world is stale and should be regenerated. The scheduler's staleness and
 * next-boundary computations are pure and deterministic (driven by the injected
 * clock); regeneration is delegated to the engine so the scheduler never talks
 * to services directly.
 */

import { IResult } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

import { GenerateWorldOptions, GeneratedWorldDTO } from '../dtos/world-generation.dto';
import { IWorldEngine } from '../interfaces/world-engine.interface';
import { IWorldScheduler } from '../interfaces/world-scheduler.interface';
import { Clock, SystemClock } from '../utils/clock.util';
import { getLocalDateKey, getNextLocalMidnight } from '../utils/date.util';

export class WorldScheduler implements IWorldScheduler {
  private readonly logger: Logger;

  constructor(
    private readonly engine: IWorldEngine,
    private readonly clock: Clock = new SystemClock()
  ) {
    this.logger = createLogger('WorldScheduler');
  }

  isStale(worldDateKey: string, timezone: string, now?: Date): boolean {
    const reference = now ?? this.clock.now();
    return getLocalDateKey(reference, timezone) !== worldDateKey;
  }

  nextRefreshAt(timezone: string, now?: Date): Date {
    const reference = now ?? this.clock.now();
    return getNextLocalMidnight(reference, timezone);
  }

  async ensureFreshWorld(
    options: GenerateWorldOptions,
    lastKnownDateKey?: string
  ): Promise<IResult<GeneratedWorldDTO>> {
    const timezone = options.timezone ?? 'UTC';
    const stale =
      lastKnownDateKey === undefined || this.isStale(lastKnownDateKey, timezone, this.clock.now());

    if (stale) {
      this.logger.info(
        { companionId: options.companionId, lastKnownDateKey },
        'World stale or absent; regenerating'
      );
      return this.engine.createTodaysWorld(options);
    }

    return this.engine.getCurrentWorld(options);
  }
}
