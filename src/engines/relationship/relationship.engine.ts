/**
 * RelationshipEngine — orchestrates relationship state management across
 * 15 independent dimensions without a single score.
 *
 * Responsibilities:
 * - Create and load relationship state
 * - Evaluate interactions deterministically
 * - Apply dimension updates and decay
 * - Apply growth strategies
 * - Generate snapshots and relationship state
 * - Persist via RelationshipService
 */

import { IResult, Result } from '@services/types/result.type';
import { IRelationshipService } from '@services/relationship/relationship.service.interface';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

import {
  RelationshipState,
  RelationshipSnapshot,
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
  EventFactory,
  EventContextBuilder,
  RelationshipCreatedEvent,
  RelationshipUpdatedEvent,
  RelationshipDimensionChangedEvent,
  AggregateType,
  EventDispatchMode,
} from '@engines/event';

export interface RelationshipEngineDeps {
  relationshipService: IRelationshipService;
  evaluator: IRelationshipEvaluator;
  updater: IRelationshipUpdater;
  strategy?: IRelationshipEvolutionStrategy;
  eventEngine?: EventEngine;
}

export class RelationshipEngine implements IRelationshipEngine {
  private readonly relationshipService: IRelationshipService;
  private readonly evaluator: IRelationshipEvaluator;
  private readonly updater: IRelationshipUpdater;
  private readonly strategy: IRelationshipEvolutionStrategy | undefined;
  private readonly eventEngine?: EventEngine;
  private readonly logger: Logger;
  private previousSnapshots: Map<string, RelationshipSnapshot> = new Map();

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
        status: 'INITIATED',
        level: 'INITIAL_ATTRACTION',
      });

      if (createResult.isFailure) {
        throw createResult.error;
      }

      const dto = createResult.value!;
      const relationshipState = await this.buildRelationshipState(userId, companionId, dto.id);

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
            status: 'INITIATED',
            phase: 'INITIAL_ATTRACTION',
          },
          context
        );

        await this.eventEngine.publish(event.getEnvelope(), EventDispatchMode.ASYNC);
      }

      return relationshipState;
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

      return this.buildRelationshipState(userId, companionId, result.value!.id);
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

      const relationshipId = relationshipResult.value!.id;
      const previousSnapshot = this.createInitialSnapshot(userId, companionId, relationshipId);
      this.previousSnapshots.set(relationshipId, previousSnapshot);

      const snapshot = this.createInitialSnapshot(userId, companionId, relationshipId);
      const updateResult = await this.updater.applyEvent(snapshot, event);

      if (updateResult.isFailure) {
        throw updateResult.error;
      }

      const updatedSnapshot = updateResult.value!;
      await this.relationshipService.updateLastInteraction(relationshipId);

      if (this.eventEngine) {
        await this.publishDimensionChanges(
          previousSnapshot,
          updatedSnapshot,
          userId,
          companionId,
          relationshipId
        );
        await this.publishRelationshipUpdate(updatedSnapshot, userId, companionId, relationshipId);
      }

      return updatedSnapshot;
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

      const snapshot = this.createInitialSnapshot(userId, companionId, relationshipResult.value!.id);
      if (!this.strategy) {
        return this.buildRelationshipState(userId, companionId, relationshipResult.value!.id);
      }

      const strategyResult = this.strategy.recommendStrategy(snapshot);

      if (strategyResult.isFailure) {
        throw strategyResult.error;
      }

      const executeResult = await this.strategy.execute(snapshot);

      if (executeResult.isFailure) {
        throw executeResult.error;
      }

      return this.buildRelationshipState(userId, companionId, relationshipResult.value!.id);
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

      return this.createInitialSnapshot(userId, companionId, relationshipResult.value!.id);
    });
  }

  async getHistory(_userId: string, _companionId: string): Promise<IResult<RelationshipEvent[]>> {
    return Result.tryAsync(async () => {
      return [];
    });
  }

  private createInitialSnapshot(
    userId: string,
    companionId: string,
    relationshipId: string
  ): RelationshipSnapshot {
    const dimensions: Record<RelationshipDimensionType, any> = {} as Record<RelationshipDimensionType, any>;

    const dimensionTypes = [
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

    for (const type of dimensionTypes) {
      dimensions[type] = {
        type,
        value: 30,
        lastUpdated: new Date(),
        changeHistory: [],
        trend: 0,
      };
    }

    return {
      id: relationshipId,
      userId,
      companionId,
      status: RelationshipStatus.INITIATED,
      phase: RelationshipPhase.INITIAL_ATTRACTION,
      dimensions,
      overallHealth: 30,
      trajectory: 0,
      strengths: [],
      vulnerabilities: dimensionTypes.slice(0, 3),
      nextGrowthOpportunity: GrowthStrategyType.CONVERSATION_QUALITY,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async buildRelationshipState(
    userId: string,
    companionId: string,
    relationshipId: string
  ): Promise<RelationshipState> {
    const snapshot = this.createInitialSnapshot(userId, companionId, relationshipId);

    return {
      userId,
      companionId,
      status: snapshot.status,
      phase: snapshot.phase,
      snapshot,
      timeline: {
        userId,
        companionId,
        events: [],
        lastEventAt: new Date(),
        eventCount: 0,
        totalImpact: 0,
      },
      activeStrategies: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        lastEvaluationAt: new Date(),
      },
    };
  }

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

    for (const dimensionType of Object.values(RelationshipDimensionType)) {
      const prevDim = previousSnapshot.dimensions[dimensionType];
      const currDim = currentSnapshot.dimensions[dimensionType];

      if (prevDim && currDim && prevDim.value !== currDim.value) {
        const event = new RelationshipDimensionChangedEvent(
          relationshipId,
          {
            userId,
            companionId,
            dimension: dimensionType,
            oldValue: prevDim.value,
            newValue: currDim.value,
            change: currDim.value - prevDim.value,
            reason: currDim.changeHistory[currDim.changeHistory.length - 1]?.reason || 'Unknown',
          },
          context
        );

        await this.eventEngine.publish(event.getEnvelope(), EventDispatchMode.ASYNC);
      }
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
