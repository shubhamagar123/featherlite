/**
 * WorldEngine contract.
 *
 * The engine is the public face of the module. It composes pure generation with
 * persistence through the service layer. It never touches Prisma, Express, or
 * HTTP — it only speaks to services and to the builder.
 */

import { IResult } from '@services/types/result.type';
import { GenerateWorldOptions, GeneratedWorldDTO } from '../dtos/world-generation.dto';

/** Partial manual overrides that a caller can force onto the world. */
export interface WorldOverrideDTO {
  scene?: string;
  timeOfDay?: string;
  season?: string;
  mood?: string;
}

export interface IWorldEngine {
  /**
   * Pure generation: compute the world for the given options without any
   * persistence. Always succeeds for a valid companion id.
   */
  generate(options: GenerateWorldOptions): GeneratedWorldDTO;

  /**
   * Create (generate + persist) today's world for a companion. The generated
   * world is returned regardless of whether a persisted WorldState row exists.
   */
  createTodaysWorld(options: GenerateWorldOptions): Promise<IResult<GeneratedWorldDTO>>;

  /**
   * Return the companion's current world. Because generation is deterministic,
   * this reproduces exactly what `createTodaysWorld` produced earlier today.
   */
  getCurrentWorld(options: GenerateWorldOptions): Promise<IResult<GeneratedWorldDTO>>;

  /**
   * Regenerate the world "as of now" and persist its environment scalars.
   */
  refreshWorld(options: GenerateWorldOptions): Promise<IResult<GeneratedWorldDTO>>;

  /**
   * Apply manual overrides on top of the generated world and persist them.
   */
  updateWorldState(
    options: GenerateWorldOptions,
    overrides: WorldOverrideDTO
  ): Promise<IResult<GeneratedWorldDTO>>;
}
