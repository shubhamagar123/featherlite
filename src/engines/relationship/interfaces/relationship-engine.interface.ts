import { IResult } from '@services/types/result.type';
import {
  RelationshipState,
  RelationshipSnapshot,
  InteractionEvaluationInput,
  InteractionEvaluationResult,
  RelationshipEvent,
} from '../dtos/relationship.dtos';

export interface IRelationshipEngine {
  /**
   * Create a new relationship between user and companion.
   */
  createRelationship(userId: string, companionId: string): Promise<IResult<RelationshipState>>;

  /**
   * Load existing relationship state.
   */
  getRelationship(userId: string, companionId: string): Promise<IResult<RelationshipState>>;

  /**
   * Evaluate an interaction and determine its impact on the relationship.
   */
  evaluateInteraction(input: InteractionEvaluationInput): Promise<IResult<InteractionEvaluationResult>>;

  /**
   * Record an event and update relationship dimensions.
   */
  recordEvent(userId: string, companionId: string, event: RelationshipEvent): Promise<IResult<RelationshipSnapshot>>;

  /**
   * Apply growth strategies and evolve the relationship.
   */
  evolveRelationship(userId: string, companionId: string): Promise<IResult<RelationshipState>>;

  /**
   * Get current snapshot (multi-dimensional state).
   */
  getSnapshot(userId: string, companionId: string): Promise<IResult<RelationshipSnapshot>>;

  /**
   * Get relationship history (timeline).
   */
  getHistory(userId: string, companionId: string): Promise<IResult<RelationshipEvent[]>>;
}
