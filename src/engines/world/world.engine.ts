/**
 * WorldEngine — public orchestrator of world generation + persistence.
 *
 * Boundaries:
 *  - Talks ONLY to services (IWorldService) and the pure builder.
 *  - Never imports Prisma, Express, HTTP, or AI.
 *  - Generation is pure and deterministic; persistence is best-effort and does
 *    not change what is generated.
 *
 * Because generation is deterministic, the engine can always reconstruct the
 * full rich world from the seed. Persistence therefore only needs to store the
 * environment scalars the WorldState model exposes (time of day, season, scene,
 * mood); everything else is regenerated on demand.
 */

import { IResult, Result } from '@services/types/result.type';
import { IWorldService } from '@services/world/world.service.interface';
import { UpdateWorldStateDTO } from '@services/dtos/world.dto';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

import { Scene, Season, TimeOfDay } from './enums/world.enums';
import { GenerateWorldOptions, GeneratedWorldDTO } from './dtos/world-generation.dto';
import { WorldContext } from './context/world-context';
import { WorldBuilder } from './builder/world.builder';
import { IWorldBuilder } from './interfaces/world-builder.interface';
import { IWorldEngine, WorldOverrideDTO } from './interfaces/world-engine.interface';
import { Clock, SystemClock } from './utils/clock.util';

/** Parse a persisted string back into a Scene enum, if it is one. */
function parseScene(value?: string | null): Scene | undefined {
  if (value && (Object.values(Scene) as string[]).includes(value)) {
    return value as Scene;
  }
  return undefined;
}

/** Parse a persisted string back into a TimeOfDay enum, if it is one. */
function parseTimeOfDay(value?: string | null): TimeOfDay | undefined {
  if (value && (Object.values(TimeOfDay) as string[]).includes(value)) {
    return value as TimeOfDay;
  }
  return undefined;
}

export class WorldEngine implements IWorldEngine {
  private readonly logger: Logger;

  constructor(
    private readonly worldService: IWorldService,
    private readonly builder: IWorldBuilder = new WorldBuilder(),
    private readonly clock: Clock = new SystemClock()
  ) {
    this.logger = createLogger('WorldEngine');
  }

  // --------------------------------------------------------------------------
  // Pure generation
  // --------------------------------------------------------------------------

  generate(options: GenerateWorldOptions): GeneratedWorldDTO {
    const context = WorldContext.create(options, this.clock);
    return this.builder.build(context);
  }

  // --------------------------------------------------------------------------
  // Persistence-backed operations
  // --------------------------------------------------------------------------

  async createTodaysWorld(options: GenerateWorldOptions): Promise<IResult<GeneratedWorldDTO>> {
    try {
      const world = this.generate(options);
      await this.persistEnvironment(options.companionId, world);
      this.logger.info(
        { companionId: options.companionId, mode: world.mode, date: world.date },
        'Created today\'s world'
      );
      return Result.success(world);
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to create today\'s world');
      return Result.failure(new Error('Failed to create today\'s world'));
    }
  }

  async getCurrentWorld(options: GenerateWorldOptions): Promise<IResult<GeneratedWorldDTO>> {
    try {
      const base = this.generate(options);
      const overlaid = await this.overlayPersistedState(options.companionId, base);
      return Result.success(overlaid);
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to get current world');
      return Result.failure(new Error('Failed to get current world'));
    }
  }

  async refreshWorld(options: GenerateWorldOptions): Promise<IResult<GeneratedWorldDTO>> {
    try {
      // Refresh regenerates "as of now" (ignoring any supplied referenceDate) so
      // the world reflects the current time of day.
      const refreshOptions: GenerateWorldOptions = {
        ...options,
        referenceDate: this.clock.now(),
      };
      const world = this.generate(refreshOptions);
      await this.persistEnvironment(options.companionId, world);
      this.logger.info(
        { companionId: options.companionId, timeOfDay: world.timeOfDay },
        'Refreshed world'
      );
      return Result.success(world);
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to refresh world');
      return Result.failure(new Error('Failed to refresh world'));
    }
  }

  async updateWorldState(
    options: GenerateWorldOptions,
    overrides: WorldOverrideDTO
  ): Promise<IResult<GeneratedWorldDTO>> {
    try {
      const base = this.generate(options);

      const scene = parseScene(overrides.scene) ?? base.scene;
      const timeOfDay = parseTimeOfDay(overrides.timeOfDay) ?? base.timeOfDay;
      const mood = overrides.mood ?? base.mood;

      const updated: GeneratedWorldDTO = { ...base, scene, timeOfDay, mood };

      await this.persistEnvironment(options.companionId, updated);
      this.logger.info(
        { companionId: options.companionId, overrides },
        'Applied manual world overrides'
      );
      return Result.success(updated);
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to update world state');
      return Result.failure(new Error('Failed to update world state'));
    }
  }

  // --------------------------------------------------------------------------
  // Private helpers — the only place that speaks to the service layer.
  // --------------------------------------------------------------------------

  /**
   * Persist the world's environment scalars onto the companion's WorldState.
   * Best-effort: if no WorldState row exists yet the world is still returned to
   * the caller (generation never depends on persistence).
   *
   * @returns true if the update was persisted.
   */
  private async persistEnvironment(
    companionId: string,
    world: GeneratedWorldDTO
  ): Promise<boolean> {
    const existing = await this.worldService.getWorldByCompanionId(companionId);
    if (!existing.isSuccess || !existing.value) {
      this.logger.warn(
        { companionId },
        'No WorldState to persist into; returning generated world only'
      );
      return false;
    }

    const patch: UpdateWorldStateDTO = {
      timeOfDay: world.timeOfDay,
      season: world.season,
      globalMood: world.mood,
      currentScene: world.scene,
    };

    const updated = await this.worldService.updateWorldState(existing.value.id, patch);
    return updated.isSuccess;
  }

  /**
   * Overlay any persisted manual overrides onto a freshly generated world, so
   * reads reflect explicit `updateWorldState` calls made earlier today. Falls
   * back silently to the generated values when nothing is persisted.
   */
  private async overlayPersistedState(
    companionId: string,
    base: GeneratedWorldDTO
  ): Promise<GeneratedWorldDTO> {
    const existing = await this.worldService.getWorldByCompanionId(companionId);
    if (!existing.isSuccess || !existing.value) {
      return base;
    }

    const persisted = existing.value;
    const scene = parseScene(persisted.currentScene) ?? base.scene;
    const timeOfDay = parseTimeOfDay(persisted.timeOfDay) ?? base.timeOfDay;
    const season = this.parseSeasonOrDefault(persisted.season, base.season);
    const mood = persisted.globalMood ?? base.mood;

    return { ...base, scene, timeOfDay, season, mood };
  }

  private parseSeasonOrDefault(value: string | undefined, fallback: Season): Season {
    if (value && (Object.values(Season) as string[]).includes(value)) {
      return value as Season;
    }
    return fallback;
  }
}
