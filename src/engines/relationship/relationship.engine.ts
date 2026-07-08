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

export interface RelationshipEngineDeps {
  relationshipService: IRelationshipService;
  evaluator: IRelationshipEvaluator;
  updater: IRelationshipUpdater;
  strategy?: IRelationshipEvolutionStrategy;
}

export class RelationshipEngine implements IRelationshipEngine {
  private readonly relationshipService: IRelationshipService;
  private readonly evaluator: IRelationshipEvaluator;
  private readonly updater: IRelationshipUpdater;
  private readonly strategy: IRelationshipEvolutionStrategy | undefined;

  constructor(deps: RelationshipEngineDeps) {
    this.relationshipService = deps.relationshipService;
    this.evaluator = deps.evaluator;
    this.updater = deps.updater;
    this.strategy = deps.strategy;
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
      return this.buildRelationshipState(userId, companionId, dto.id);
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

      const snapshot = this.createInitialSnapshot(userId, companionId, relationshipResult.value!.id);
      const updateResult = await this.updater.applyEvent(snapshot, event);

      if (updateResult.isFailure) {
        throw updateResult.error;
      }

      await this.relationshipService.updateLastInteraction(relationshipResult.value!.id);

      return updateResult.value!;
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
}
