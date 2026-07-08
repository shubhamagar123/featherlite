/**
 * InteractionOrchestrator contract.
 *
 * The Interaction Engine orchestrates all modes of interaction between user and
 * companion: text chat, voice calls, activities, presence, typing, streaming,
 * interruptions, and silence. It delegates to specialized managers and maintains
 * session state across all interaction types.
 */

import { IResult } from '@services/types/result.type';
import {
  ProcessInteractionRequest,
  ProcessInteractionResult,
  InteractionSession,
  InteractionSessionSummary,
  AnyInteraction,
} from '../dtos/interaction.dtos';

export interface IInteractionOrchestrator {
  /** Process a single interaction event. */
  processInteraction(
    request: ProcessInteractionRequest
  ): Promise<IResult<ProcessInteractionResult>>;

  /** Get an active interaction session. */
  getSession(sessionId: string, userId: string): Promise<IResult<InteractionSession>>;

  /** Create a new interaction session. */
  createSession(userId: string, companionId: string): Promise<IResult<InteractionSession>>;

  /** End an interaction session. */
  endSession(sessionId: string, userId: string): Promise<IResult<InteractionSessionSummary>>;

  /** Get session history (recent interactions). */
  getSessionHistory(
    sessionId: string,
    userId: string,
    limit?: number
  ): Promise<IResult<AnyInteraction[]>>;

  /** Get session summary. */
  getSessionSummary(sessionId: string, userId: string): Promise<IResult<InteractionSessionSummary>>;
}
