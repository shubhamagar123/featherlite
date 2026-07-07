/**
 * CompanionEngine contract.
 *
 * The engine is the public face of the module. It resolves the live life-state
 * of any registered companion by synchronizing its profile with the World
 * Engine and applying deterministic rules. It NEVER generates AI replies and
 * never touches Prisma/HTTP — it speaks only to the World Engine and services.
 */

import { IResult } from '@services/types/result.type';
import { Availability } from '../enums/companion.enums';
import {
  CompanionPreferencesDTO,
  CompanionProfileDTO,
  CompanionScheduleBlockDTO,
  CompanionStateSnapshotDTO,
  CompanionTransitionDTO,
  ResolveCompanionOptions,
} from '../dtos/companion.dtos';

export interface ICompanionEngine {
  /** All companions the engine knows about (from the registry). */
  listCompanions(): CompanionProfileDTO[];

  /** Fetch a companion's profile. */
  getProfile(companionId: string): IResult<CompanionProfileDTO>;

  /** Fetch a companion's preferences. */
  getPreferences(companionId: string): IResult<CompanionPreferencesDTO>;

  /** The schedule block active for the companion at the given time. */
  getCurrentScheduleBlock(
    options: ResolveCompanionOptions
  ): Promise<IResult<CompanionScheduleBlockDTO | null>>;

  /**
   * Resolve the companion's full life-state, synchronized with its world.
   * This is the engine's primary method.
   */
  resolveState(options: ResolveCompanionOptions): Promise<IResult<CompanionStateSnapshotDTO>>;

  /** Resolve just the companion's availability. */
  getAvailability(options: ResolveCompanionOptions): Promise<IResult<Availability>>;

  /**
   * Resolve the current life-state and, given `options.previousState`, plan the
   * legal transition step toward it.
   */
  planTransition(options: ResolveCompanionOptions): Promise<IResult<CompanionTransitionDTO>>;
}
