/**
 * CompanionEngine — public orchestrator of a companion's life.
 *
 * Responsibilities: resolve the live life-state (state, mood, expression,
 * gesture, location, outfit, availability), the active schedule block, and
 * state transitions for ANY registered companion — synchronized with that
 * companion's world.
 *
 * Boundaries:
 *  - NEVER generates AI replies.
 *  - Talks only to the World Engine (for world sync) and the service layer.
 *  - No Prisma, HTTP, or hardcoded companion names (profiles come from seed data).
 *
 * Resolution order (each step may read everything above it):
 *   world  ->  schedule block  ->  state  ->  mood  ->  location
 *   ->  expression  ->  gesture  ->  outfit  ->  availability
 */

import { IResult, Result } from '@services/types/result.type';
import { NotFoundError } from '@services/exceptions';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import {
  type Clock,
  type IWorldEngine,
  SystemClock,
} from '@engines/world';

import { Availability } from './enums/companion.enums';
import {
  CompanionPreferencesDTO,
  CompanionProfileDTO,
  CompanionScheduleBlockDTO,
  CompanionStateSnapshotDTO,
  CompanionTransitionDTO,
  ResolveCompanionOptions,
} from './dtos/companion.dtos';
import { CompanionContext } from './context/companion-context';
import { ICompanionEngine } from './interfaces/companion-engine.interface';
import { ICompanionRegistry } from './interfaces/companion-registry.interface';
import { ICompanionRules } from './interfaces/managers.interface';
import { ICompanionScheduler } from './interfaces/companion-scheduler.interface';
import { ICompanionStateMachine } from './interfaces/state-machine.interface';
import { ICompanionTransitionManager } from './interfaces/transition-manager.interface';
import {
  IAvailabilityManager,
  IExpressionManager,
  IGestureManager,
  ILocationManager,
  IOutfitManager,
} from './interfaces/managers.interface';

/** Collaborators the engine composes (all injected via the factory). */
export interface CompanionEngineDeps {
  registry: ICompanionRegistry;
  worldEngine: IWorldEngine;
  rules: ICompanionRules;
  scheduler: ICompanionScheduler;
  stateMachine: ICompanionStateMachine;
  transitionManager: ICompanionTransitionManager;
  locationManager: ILocationManager;
  expressionManager: IExpressionManager;
  gestureManager: IGestureManager;
  outfitManager: IOutfitManager;
  availabilityManager: IAvailabilityManager;
  clock?: Clock;
}

export class CompanionEngine implements ICompanionEngine {
  private readonly logger: Logger;
  private readonly clock: Clock;

  constructor(private readonly deps: CompanionEngineDeps) {
    this.clock = deps.clock ?? new SystemClock();
    this.logger = createLogger('CompanionEngine');
  }

  listCompanions(): CompanionProfileDTO[] {
    return this.deps.registry.all();
  }

  getProfile(companionId: string): IResult<CompanionProfileDTO> {
    const profile = this.deps.registry.get(companionId);
    if (!profile) return Result.failure(new NotFoundError('Companion', companionId));
    return Result.success(profile);
  }

  getPreferences(companionId: string): IResult<CompanionPreferencesDTO> {
    const profile = this.deps.registry.get(companionId);
    if (!profile) return Result.failure(new NotFoundError('Companion', companionId));
    return Result.success(profile.preferences);
  }

  async getCurrentScheduleBlock(
    options: ResolveCompanionOptions
  ): Promise<IResult<CompanionScheduleBlockDTO | null>> {
    const contextResult = await this.resolveContext(options);
    if (!contextResult.isSuccess || !contextResult.value) {
      return Result.failure(contextResult.error ?? new Error('Failed to resolve context'));
    }
    const context = contextResult.value;
    const block = this.deps.scheduler.resolveBlock(context.profile.schedule, context.localHour);
    return Result.success(block);
  }

  async resolveState(
    options: ResolveCompanionOptions
  ): Promise<IResult<CompanionStateSnapshotDTO>> {
    try {
      const contextResult = await this.resolveContext(options);
      if (!contextResult.isSuccess || !contextResult.value) {
        return Result.failure(contextResult.error ?? new Error('Failed to resolve context'));
      }
      const snapshot = this.resolveSnapshot(contextResult.value);
      this.logger.info(
        { companionId: options.companionId, state: snapshot.state, mood: snapshot.mood },
        'Resolved companion life-state'
      );
      return Result.success(snapshot);
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to resolve companion state');
      return Result.failure(new Error('Failed to resolve companion state'));
    }
  }

  async getAvailability(options: ResolveCompanionOptions): Promise<IResult<Availability>> {
    const result = await this.resolveState(options);
    if (!result.isSuccess || !result.value) {
      return Result.failure(result.error ?? new Error('Failed to resolve availability'));
    }
    return Result.success(result.value.availability);
  }

  async planTransition(
    options: ResolveCompanionOptions
  ): Promise<IResult<CompanionTransitionDTO>> {
    const result = await this.resolveState(options);
    if (!result.isSuccess || !result.value) {
      return Result.failure(result.error ?? new Error('Failed to plan transition'));
    }
    const target = result.value.state;
    const from = options.previousState ?? target;
    return Result.success(this.deps.transitionManager.plan(from, target));
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /** Load the profile + synchronized world and build the resolution context. */
  private async resolveContext(
    options: ResolveCompanionOptions
  ): Promise<IResult<CompanionContext>> {
    const profile = this.deps.registry.get(options.companionId);
    if (!profile) {
      return Result.failure(new NotFoundError('Companion', options.companionId));
    }

    // Synchronize with the world — supplied directly or fetched from the World
    // Engine for this companion.
    let world = options.world;
    if (!world) {
      const worldResult = await this.deps.worldEngine.getCurrentWorld({
        companionId: options.companionId,
        referenceDate: options.referenceDate,
        timezone: options.timezone,
      });
      if (!worldResult.isSuccess || !worldResult.value) {
        return Result.failure(worldResult.error ?? new Error('Failed to synchronize world'));
      }
      world = worldResult.value;
    }

    return Result.success(CompanionContext.create(profile, world, options, this.clock));
  }

  /** Run the full deterministic resolution pipeline for a context. */
  private resolveSnapshot(context: CompanionContext): CompanionStateSnapshotDTO {
    const block = this.deps.scheduler.resolveBlock(context.profile.schedule, context.localHour);
    const state = this.deps.stateMachine.resolveState(context, block);
    const mood = this.deps.rules.deriveMood({ context, state });
    const location = this.deps.locationManager.resolve({ context, state });
    const expression = this.deps.expressionManager.resolve({ context, state, mood });
    const gesture = this.deps.gestureManager.resolve({ context, state, location });
    const outfit = this.deps.outfitManager.resolve({ context, state, location });
    const availability = this.deps.availabilityManager.resolve({ context, state, mood });

    return {
      companionId: context.profile.id,
      name: context.profile.identity.name,
      displayName: context.profile.identity.displayName,
      date: context.world.date,
      timezone: context.timezone,
      timeOfDay: context.timeOfDay,
      state,
      mood,
      expression,
      gesture,
      location,
      outfit,
      availability,
      scheduleLabel: block?.label ?? 'unscheduled',
      worldScene: context.world.scene,
      worldWeather: context.world.weather,
      seed: context.seed,
      resolvedAt: new Date().toISOString(),
    };
  }
}
