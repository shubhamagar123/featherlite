/**
 * RelationshipEngine — orchestrates relationship state management across
 * 12 independent dimensions on top of an aggregate persistence layer.
 *
 * Responsibilities:
 * - Load persisted relationship state and hydrate a rich in-memory snapshot
 *   with all 12 dimensions derived from the 3 aggregate scores that the
 *   database currently stores (affection, trust, familiarity).
 * - Apply events to the snapshot via the updater, then project the resulting
 *   dimensions back to the persistence layer's aggregate scores.
 * - Publish real dimension deltas (never fake ones) so downstream engines
 *   consume ground-truth events.
 *
 * Schema debt: the database only stores three aggregate scores today. This
 * engine treats the aggregate scores as a lossy projection of the 12 canonical
 * dimensions. The projection rules are declared here (see `hydrateSnapshotFromDto`
 * and `projectSnapshotToUpdate`) so behaviour is deterministic. A follow-up
 * migration (Phase 2) adds a dedicated dimensions table and removes the
 * derivation.
 */

import { IResult, Result } from '@services/types/result.type';
import { IRelationshipService } from '@services/relationship/relationship.service.interface';
import { RelationshipDTO } from '@services/dtos/relationship.dto';
import { NotImplementedError } from '@services/exceptions';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

import {
  RelationshipState,
  RelationshipSnapshot,
  RelationshipDimension,
  InteractionEvaluationInput,
  InteractionEvaluationResult,
  RelationshipEvent,
} from './dtos/relationship.dtos';
import {
  RelationshipDimensionType,
  RelationshipStatus,
  RelationshipPhase,
  GrowthStrategyType,
} from './enums/relationship.enums';
import { IRelationshipEngine } from './interfaces/relationship-engine.interface';
import { IRelationshipEvaluator } from './interfaces/relationship-evaluator.interface';
import { IRelationshipUpdater } from './interfaces/relationship-updater.interface';
import { IRelationshipEvolutionStrategy } from './interfaces/relationship-strategy.interface';
import { EventEngine } from '@engines/event';
import {
  EventContextBuilder,
  RelationshipCreatedEvent,
  RelationshipUpdatedEvent,
  RelationshipDimensionChangedEvent,
  EventDispatchMode,
} from '@engines/event';

export interface RelationshipEngineDeps {
  relationshipService: IRelationshipService;
  evaluator: IRelationshipEvaluator;
  updater: IRelationshipUpdater;
  strategy?: IRelationshipEvolutionStrategy;
  eventEngine?: EventEngine;
}

const ALL_DIMENSIONS: RelationshipDimensionType[] = [
  RelationshipDimensionType.TRUST,
  RelationshipDimensionType.COMFORT,
  RelationshipDimensionType.PLAYFULNESS,
  RelationshipDimensionType.EMOTIONAL_DEPTH,
  RelationshipDimensionType.COMMUNICATION_STYLE,
  RelationshipDimensionType.SHARED_RITUALS,
  RelationshipDimensionType.SHARED_MEMORIES,
  RelationshipDimensionType.BOUNDARIES,
  RelationshipDimensionType.FAMILIARITY,
  RelationshipDimensionType.RELIABILITY,
  RelationshipDimensionType.SUPPORTIVENESS,
  RelationshipDimensionType.RESPECT,
];

export class RelationshipEngine implements IRelationshipEngine {
  private readonly relationshipService: IRelationshipService;
  private readonly evaluator: IRelationshipEvaluator;
  private readonly updater: IRelationshipUpdater;
  private readonly strategy: IRelationshipEvolutionStrategy | undefined;
  private readonly eventEngine?: EventEngine;
  private readonly logger: Logger;

  constructor(deps: RelationshipEngineDeps) {
    this.relationshipService = deps.relationshipService;
    this.evaluator = deps.evaluator;
    this.updater = deps.updater;
    this.strategy = deps.strategy;
    this.eventEngine = deps.eventEngine;
    this.logger = createLogger('RelationshipEngine');
  }

  async createRelationship(userId: string, companionId: string): Promise<IResult<RelationshipState>> {
    return Result.tryAsync(async () => {
      const createResult = await this.relationshipService.createRelationship({
        userId,
        companionId,
        status: RelationshipStatus.INITIATED,
        level: RelationshipPhase.INITIAL_ATTRACTION,
      });

      if (createResult.isFailure) {
        throw createResult.error;
      }

      const dto = createResult.value!;
      const state = this.buildRelationshipStateFromDto(dto);

      if (this.eventEngine) {
        const context = EventContextBuilder.create()
          .withUserId(userId)
          .withCompanionId(companionId)
          .build();

        const event = new RelationshipCreatedEvent(
          dto.id,
          {
            userId,
            companionId,
            status: RelationshipStatus.INITIATED,
            phase: RelationshipPhase.INITIAL_ATTRACTION,
          },
          context
        );

        await this.eventEngine.publish(event.getEnvelope(), EventDispatchMode.ASYNC);
      }

      return state;
    });
  }

  async getRelationship(userId: string, companionId: string): Promise<IResult<RelationshipState>> {
    return Result.tryAsync(async () => {
      const result = await this.relationshipService.getRelationshipByUserAndCompanion(
        userId,
        companionId
      );

      if (result.isFailure) {
        throw result.error;
      }

      return this.buildRelationshipStateFromDto(result.value!);
    });
  }

  async evaluateInteraction(
    input: InteractionEvaluationInput
  ): Promise<IResult<InteractionEvaluationResult>> {
    return this.evaluator.evaluateInteraction(input);
  }

  async recordEvent(
    userId: string,
    companionId: string,
    event: RelationshipEvent
  ): Promise<IResult<RelationshipSnapshot>> {
    return Result.tryAsync(async () => {
      const relationshipResult = await this.relationshipService.getRelationshipByUserAndCompanion(
        userId,
        companionId
      );

      if (relationshipResult.isFailure) {
        throw relationshipResult.error;
      }

      const dto = relationshipResult.value!;
      const previousSnapshot = this.hydrateSnapshotFromDto(dto);

      const updateResult = await this.updater.applyEvent(previousSnapshot, event);
      if (updateResult.isFailure) {
        throw updateResult.error;
      }
      const nextSnapshot = updateResult.value!;

      const persistPatch = this.projectSnapshotToUpdate(previousSnapshot, nextSnapshot);
      if (Object.keys(persistPatch).length > 0) {
        const persistResult = await this.relationshipService.updateRelationship(dto.id, persistPatch);
        if (persistResult.isFailure) {
          throw persistResult.error;
        }
      }

      const bumpResult = await this.relationshipService.updateLastInteraction(dto.id);
      if (bumpResult.isFailure) {
        this.logger.warn(
          { err: bumpResult.error, relationshipId: dto.id },
          'Failed to bump last-interaction timestamp; continuing'
        );
      }

      if (this.eventEngine) {
        await this.publishDimensionChanges(
          previousSnapshot,
          nextSnapshot,
          userId,
          companionId,
          dto.id
        );
        await this.publishRelationshipUpdate(nextSnapshot, userId, companionId, dto.id);
      }

      return nextSnapshot;
    });
  }

  async evolveRelationship(
    userId: string,
    companionId: string
  ): Promise<IResult<RelationshipState>> {
    return Result.tryAsync(async () => {
      const relationshipResult = await this.relationshipService.getRelationshipByUserAndCompanion(
        userId,
        companionId
      );

      if (relationshipResult.isFailure) {
        throw relationshipResult.error;
      }

      const dto = relationshipResult.value!;
      const snapshot = this.hydrateSnapshotFromDto(dto);

      if (!this.strategy) {
        return this.buildRelationshipStateFromDto(dto);
      }

      const strategyResult = this.strategy.recommendStrategy(snapshot);
      if (strategyResult.isFailure) {
        throw strategyResult.error;
      }

      const executeResult = await this.strategy.execute(snapshot);
      if (executeResult.isFailure) {
        throw executeResult.error;
      }

      const executedSnapshot = executeResult.value ?? snapshot;
      const persistPatch = this.projectSnapshotToUpdate(snapshot, executedSnapshot);
      if (Object.keys(persistPatch).length > 0) {
        const persistResult = await this.relationshipService.updateRelationship(dto.id, persistPatch);
        if (persistResult.isFailure) {
          throw persistResult.error;
        }
        const refreshed = await this.relationshipService.getRelationshipById(dto.id);
        if (refreshed.isSuccess && refreshed.value) {
          return this.buildRelationshipStateFromDto(refreshed.value);
        }
      }

      return this.buildRelationshipStateFromDto(dto);
    });
  }

  async getSnapshot(userId: string, companionId: string): Promise<IResult<RelationshipSnapshot>> {
    return Result.tryAsync(async () => {
      const relationshipResult = await this.relationshipService.getRelationshipByUserAndCompanion(
        userId,
        companionId
      );

      if (relationshipResult.isFailure) {
        throw relationshipResult.error;
      }

      return this.hydrateSnapshotFromDto(relationshipResult.value!);
    });
  }

  async getHistory(_userId: string, _companionId: string): Promise<IResult<RelationshipEvent[]>> {
    // Schema debt: no relationship_events table yet. Fail loudly rather than
    // returning [] which callers cannot distinguish from "no history".
    return Result.failure(new NotImplementedError('RelationshipEngine.getHistory'));
  }

  // --------------------------------------------------------------------------
  // Snapshot hydration
  // --------------------------------------------------------------------------

  /**
   * Build the outward-facing RelationshipState (snapshot + metadata) from a
   * persisted DTO. Wraps `hydrateSnapshotFromDto` so callers get consistent
   * metadata (createdAt/updatedAt/version) alongside the snapshot.
   */
  private buildRelationshipStateFromDto(dto: RelationshipDTO): RelationshipState {
    const snapshot = this.hydrateSnapshotFromDto(dto);
    return {
      userId: dto.userId,
      companionId: dto.companionId,
      status: snapshot.status,
      phase: snapshot.phase,
      snapshot,
      timeline: {
        userId: dto.userId,
        companionId: dto.companionId,
        events: [],
        lastEventAt: dto.lastInteractionAt ?? dto.updatedAt,
        eventCount: dto.totalInteractions,
        totalImpact: 0,
      },
      activeStrategies: [],
      metadata: {
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        version: '1.0',
        lastEvaluationAt: dto.lastInteractionAt ?? dto.updatedAt,
      },
    };
  }

  /**
   * Build a RelationshipSnapshot from persisted state. Derives all 12
   * dimensions from the three aggregate scores that the persistence layer
   * currently stores; the projection rules are declared explicitly so
   * behaviour is deterministic and testable.
   */
  private hydrateSnapshotFromDto(dto: RelationshipDTO): RelationshipSnapshot {
    const now = new Date();
    const lastUpdated = dto.updatedAt ?? now;

    const trust = this.clamp(dto.trustScore, 0, 100);
    const affection = this.clamp(dto.affectionScore, 0, 100);
    const familiarity = this.clamp(dto.familiarityScore, 0, 100);
    const interactionSaturation = this.clamp(dto.totalInteractions * 2, 0, 100);

    const values: Record<RelationshipDimensionType, number> = {
      [RelationshipDimensionType.TRUST]: trust,
      [RelationshipDimensionType.FAMILIARITY]: familiarity,
      [RelationshipDimensionType.EMOTIONAL_DEPTH]: affection,
      [RelationshipDimensionType.COMFORT]: this.clamp(0.5 * affection + 0.5 * familiarity, 0, 100),
      [RelationshipDimensionType.RESPECT]: this.clamp(0.6 * trust + 0.4 * affection, 0, 100),
      [RelationshipDimensionType.SUPPORTIVENESS]: this.clamp(0.5 * affection + 0.5 * trust, 0, 100),
      [RelationshipDimensionType.RELIABILITY]: this.clamp(0.7 * trust + 0.3 * interactionSaturation, 0, 100),
      [RelationshipDimensionType.COMMUNICATION_STYLE]: this.clamp(
        0.5 * familiarity + 0.5 * interactionSaturation,
        0,
        100
      ),
      [RelationshipDimensionType.SHARED_MEMORIES]: this.clamp(dto.totalInteractions * 5, 0, 100),
      [RelationshipDimensionType.SHARED_RITUALS]: interactionSaturation,
      [RelationshipDimensionType.BOUNDARIES]: this.clamp(0.5 * trust + 0.5 * familiarity, 0, 100),
      [RelationshipDimensionType.PLAYFULNESS]: this.clamp(
        0.5 * affection + 0.3 * familiarity + 0.2 * interactionSaturation,
        0,
        100
      ),
    };

    const dimensions: Record<RelationshipDimensionType, RelationshipDimension> =
      {} as Record<RelationshipDimensionType, RelationshipDimension>;
    for (const type of ALL_DIMENSIONS) {
      dimensions[type] = {
        type,
        value: values[type],
        lastUpdated,
        changeHistory: [],
        trend: 0,
      };
    }

    const overallHealth = this.clamp(
      ALL_DIMENSIONS.reduce((sum, dim) => sum + dimensions[dim].value, 0) / ALL_DIMENSIONS.length,
      0,
      100
    );

    const sortedByValue = [...ALL_DIMENSIONS].sort(
      (a, b) => dimensions[b].value - dimensions[a].value
    );
    const strengths = sortedByValue.slice(0, 3);
    const vulnerabilities = sortedByValue.slice(-3).reverse();

    return {
      id: dto.id,
      userId: dto.userId,
      companionId: dto.companionId,
      status: this.parseStatus(dto.status),
      phase: this.parsePhase(dto.level),
      dimensions,
      overallHealth,
      trajectory: 0,
      strengths,
      vulnerabilities,
      nextGrowthOpportunity: this.recommendGrowthOpportunity(vulnerabilities[0]),
      createdAt: dto.createdAt,
      updatedAt: lastUpdated,
    };
  }

  /**
   * Compute the persistence patch needed to reflect the delta between two
   * snapshots. Only writes the aggregate scores that changed; identity-only
   * updates are elided so we never call the service with a no-op payload.
   */
  private projectSnapshotToUpdate(
    previous: RelationshipSnapshot,
    next: RelationshipSnapshot
  ): { affectionScore?: number; trustScore?: number; familiarityScore?: number; status?: string; level?: string } {
    const patch: {
      affectionScore?: number;
      trustScore?: number;
      familiarityScore?: number;
      status?: string;
      level?: string;
    } = {};

    const nextAffection = this.roundScore(next.dimensions[RelationshipDimensionType.EMOTIONAL_DEPTH].value);
    const nextTrust = this.roundScore(next.dimensions[RelationshipDimensionType.TRUST].value);
    const nextFamiliarity = this.roundScore(next.dimensions[RelationshipDimensionType.FAMILIARITY].value);

    const prevAffection = this.roundScore(previous.dimensions[RelationshipDimensionType.EMOTIONAL_DEPTH].value);
    const prevTrust = this.roundScore(previous.dimensions[RelationshipDimensionType.TRUST].value);
    const prevFamiliarity = this.roundScore(previous.dimensions[RelationshipDimensionType.FAMILIARITY].value);

    if (nextAffection !== prevAffection) patch.affectionScore = nextAffection;
    if (nextTrust !== prevTrust) patch.trustScore = nextTrust;
    if (nextFamiliarity !== prevFamiliarity) patch.familiarityScore = nextFamiliarity;
    if (next.status !== previous.status) patch.status = next.status;
    if (next.phase !== previous.phase) patch.level = next.phase;

    return patch;
  }

  private parseStatus(raw: string | undefined | null): RelationshipStatus {
    if (raw && (Object.values(RelationshipStatus) as string[]).includes(raw)) {
      return raw as RelationshipStatus;
    }
    return RelationshipStatus.INITIATED;
  }

  private parsePhase(raw: string | undefined | null): RelationshipPhase {
    if (raw && (Object.values(RelationshipPhase) as string[]).includes(raw)) {
      return raw as RelationshipPhase;
    }
    return RelationshipPhase.INITIAL_ATTRACTION;
  }

  private recommendGrowthOpportunity(weakest: RelationshipDimensionType): GrowthStrategyType {
    switch (weakest) {
      case RelationshipDimensionType.TRUST:
      case RelationshipDimensionType.RELIABILITY:
        return GrowthStrategyType.CONSISTENCY;
      case RelationshipDimensionType.EMOTIONAL_DEPTH:
      case RelationshipDimensionType.SUPPORTIVENESS:
        return GrowthStrategyType.EMOTIONAL_VULNERABILITY;
      case RelationshipDimensionType.FAMILIARITY:
      case RelationshipDimensionType.SHARED_MEMORIES:
      case RelationshipDimensionType.SHARED_RITUALS:
        return GrowthStrategyType.SHARED_EXPERIENCES;
      case RelationshipDimensionType.COMFORT:
      case RelationshipDimensionType.PLAYFULNESS:
      case RelationshipDimensionType.COMMUNICATION_STYLE:
        return GrowthStrategyType.CONVERSATION_QUALITY;
      case RelationshipDimensionType.RESPECT:
      case RelationshipDimensionType.BOUNDARIES:
        return GrowthStrategyType.CONFLICT_RESOLUTION;
      default:
        return GrowthStrategyType.CONVERSATION_FREQUENCY;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  private roundScore(value: number): number {
    return Math.round(value * 100) / 100;
  }

  // --------------------------------------------------------------------------
  // Event publishing
  // --------------------------------------------------------------------------

  private async publishDimensionChanges(
    previousSnapshot: RelationshipSnapshot,
    currentSnapshot: RelationshipSnapshot,
    userId: string,
    companionId: string,
    relationshipId: string
  ): Promise<void> {
    if (!this.eventEngine) return;

    const context = EventContextBuilder.create()
      .withUserId(userId)
      .withCompanionId(companionId)
      .build();

    for (const dimensionType of ALL_DIMENSIONS) {
      const prevDim = previousSnapshot.dimensions[dimensionType];
      const currDim = currentSnapshot.dimensions[dimensionType];

      if (!prevDim || !currDim) continue;
      if (this.roundScore(prevDim.value) === this.roundScore(currDim.value)) continue;

      const changeEvent = new RelationshipDimensionChangedEvent(
        relationshipId,
        {
          userId,
          companionId,
          dimension: dimensionType,
          oldValue: prevDim.value,
          newValue: currDim.value,
          change: currDim.value - prevDim.value,
          reason: currDim.changeHistory[currDim.changeHistory.length - 1]?.reason ?? 'event-derived',
        },
        context
      );

      await this.eventEngine.publish(changeEvent.getEnvelope(), EventDispatchMode.ASYNC);
    }
  }

  private async publishRelationshipUpdate(
    snapshot: RelationshipSnapshot,
    userId: string,
    companionId: string,
    relationshipId: string
  ): Promise<void> {
    if (!this.eventEngine) return;

    const context = EventContextBuilder.create()
      .withUserId(userId)
      .withCompanionId(companionId)
      .build();

    const event = new RelationshipUpdatedEvent(
      relationshipId,
      {
        userId,
        companionId,
        status: snapshot.status,
        phase: snapshot.phase,
        overallHealth: snapshot.overallHealth,
        trajectory: snapshot.trajectory,
      },
      context
    );

    await this.eventEngine.publish(event.getEnvelope(), EventDispatchMode.ASYNC);
  }
}

