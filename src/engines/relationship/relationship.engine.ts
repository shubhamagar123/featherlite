/**
 * RelationshipEngine — models evolving relationships between user and companion
 * across 15 independent dimensions without a single score.
 *
 * Responsibilities:
 * - Create new relationships and initialize snapshots
 * - Load existing relationship state with full history
 * - Evaluate interactions and determine dimension impact
 * - Record events and apply dimension updates
 * - Apply growth strategies to evolve relationships
 * - Generate snapshots and relationship state
 * - Maintain multi-dimensional timeline
 */

import { IResult, Result } from '@services/types/result.type';
import { IRelationshipService } from '@services/relationship/relationship.service.interface';
import { IContextEngine } from '@engines/context';

import {
  RelationshipState,
  RelationshipSnapshot,
  InteractionEvaluationInput,
  InteractionEvaluationResult,
  RelationshipEvent,
} from './dtos/relationship.dtos';
import { IRelationshipEngine } from './interfaces/relationship-engine.interface';
import { IRelationshipContext } from './interfaces/relationship-context.interface';
import { IRelationshipEvaluator } from './interfaces/relationship-evaluator.interface';
import { IRelationshipUpdater } from './interfaces/relationship-updater.interface';
import { IRelationshipEvolutionStrategy } from './interfaces/relationship-strategy.interface';

export interface RelationshipEngineDeps {
  relationshipService: IRelationshipService;
  contextEngine: IContextEngine;
  relationshipContext: IRelationshipContext;
  evaluator: IRelationshipEvaluator;
  updater: IRelationshipUpdater;
  strategy: IRelationshipEvolutionStrategy;
}

export class RelationshipEngine implements IRelationshipEngine {
  private readonly relationshipService: IRelationshipService;
  private readonly contextEngine: IContextEngine;
  private readonly relationshipContext: IRelationshipContext;
  private readonly evaluator: IRelationshipEvaluator;
  private readonly updater: IRelationshipUpdater;
  private readonly strategy: IRelationshipEvolutionStrategy;

  constructor(deps: RelationshipEngineDeps) {
    this.relationshipService = deps.relationshipService;
    this.contextEngine = deps.contextEngine;
    this.relationshipContext = deps.relationshipContext;
    this.evaluator = deps.evaluator;
    this.updater = deps.updater;
    this.strategy = deps.strategy;
  }

  async createRelationship(userId: string, companionId: string): Promise<IResult<RelationshipState>> {
    return Result.tryAsync(async () => {
      const calcContext = await this.relationshipContext.getCalculationContext(
        userId,
        companionId,
        new Date()
      );

      const initialState = await this.relationshipService.createRelationship(
        userId,
        companionId,
        calcContext
      );

      return initialState;
    });
  }

  async getRelationship(userId: string, companionId: string): Promise<IResult<RelationshipState>> {
    return Result.tryAsync(async () => {
      return await this.relationshipService.getRelationship(userId, companionId);
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
      const getSnapshotResult = await this.relationshipService.getLatestSnapshot(
        userId,
        companionId
      );

      if (getSnapshotResult.isFailure) {
        throw getSnapshotResult.error;
      }

      const currentSnapshot = getSnapshotResult.value!;

      const updateResult = await this.updater.applyEvent(currentSnapshot, event);
      if (updateResult.isFailure) {
        throw updateResult.error;
      }

      const updatedSnapshot = updateResult.value!;

      await this.relationshipService.updateSnapshot(userId, companionId, updatedSnapshot);
      await this.relationshipService.recordEvent(userId, companionId, event);

      return updatedSnapshot;
    });
  }

  async evolveRelationship(
    userId: string,
    companionId: string
  ): Promise<IResult<RelationshipState>> {
    return Result.tryAsync(async () => {
      const relationshipResult = await this.relationshipService.getRelationship(
        userId,
        companionId
      );

      if (relationshipResult.isFailure) {
        throw relationshipResult.error;
      }

      const relationship = relationshipResult.value!;
      const strategyResult = this.strategy.recommendStrategy(relationship.snapshot);

      if (strategyResult.isFailure) {
        throw strategyResult.error;
      }

      const recommendedStrategy = strategyResult.value!;
      const executeResult = await this.strategy.execute(relationship.snapshot);

      if (executeResult.isFailure) {
        throw executeResult.error;
      }

      const evolvedSnapshot = executeResult.value!;

      const updatedState: RelationshipState = {
        ...relationship,
        snapshot: evolvedSnapshot,
        activeStrategies: [recommendedStrategy, ...relationship.activeStrategies.slice(0, 4)],
        metadata: {
          ...relationship.metadata,
          updatedAt: new Date(),
          lastEvaluationAt: new Date(),
        },
      };

      await this.relationshipService.updateState(userId, companionId, updatedState);

      return updatedState;
    });
  }

  async getSnapshot(userId: string, companionId: string): Promise<IResult<RelationshipSnapshot>> {
    return Result.tryAsync(async () => {
      const result = await this.relationshipService.getLatestSnapshot(userId, companionId);

      if (result.isFailure) {
        throw result.error;
      }

      return result.value!;
    });
  }

  async getHistory(userId: string, companionId: string): Promise<IResult<RelationshipEvent[]>> {
    return Result.tryAsync(async () => {
      const result = await this.relationshipService.getTimeline(userId, companionId);

      if (result.isFailure) {
        throw result.error;
      }

      return result.value!.events;
    });
  }
}
