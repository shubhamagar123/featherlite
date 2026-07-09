/**
 * InteractionOrchestrator — orchestrates all interaction types.
 *
 * Routes interactions to specialized managers and maintains session state
 * across text chat, voice calls, activities, presence, typing, streaming,
 * interruptions, and silence. Sessions are persisted in Redis for horizontal scale.
 */

import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { IInteractionOrchestrator } from './interfaces/interaction-orchestrator.interface';
import {
  ProcessInteractionRequest,
  ProcessInteractionResult,
  InteractionSession,
  InteractionSessionSummary,
  AnyInteraction,
} from './dtos/interaction.dtos';
import { InteractionType, InteractionSessionState } from './enums/interaction.enums';
import { ConversationManager } from './managers/conversation.manager';
import { VoiceManager } from './managers/voice.manager';
import { ActivityManager } from './managers/activity.manager';
import { PresenceManager } from './managers/presence.manager';
import { SessionManager } from './managers/session.manager';
import { InterruptionManager } from './managers/interruption.manager';
import { StreamingManager } from './managers/streaming.manager';
import { TypingManager } from './managers/typing.manager';
import { SilenceManager } from './managers/silence.manager';
import { RedisSessionService } from './services/redis-session.service';

export class InteractionOrchestrator implements IInteractionOrchestrator {
  private readonly logger: Logger;

  constructor(
    private conversationManager: ConversationManager,
    private voiceManager: VoiceManager,
    private activityManager: ActivityManager,
    private presenceManager: PresenceManager,
    _sessionManager: SessionManager,
    private interruptionManager: InterruptionManager,
    private streamingManager: StreamingManager,
    private typingManager: TypingManager,
    private silenceManager: SilenceManager,
    private sessionService: RedisSessionService
  ) {
    this.logger = createLogger('InteractionOrchestrator');
  }

  async processInteraction(
    request: ProcessInteractionRequest
  ): Promise<IResult<ProcessInteractionResult>> {
    try {
      const sessionId = request.sessionId || `session_${request.userId}_${Date.now()}`;
      const interactionId = request.interaction.id || `int_${Date.now()}`;

      this.logger.info(
        {
          sessionId,
          interactionType: request.interaction.type,
          userId: request.userId,
        },
        'Processing interaction'
      );

      // Route to appropriate manager
      const routeResult = await this.routeInteraction(request);
      if (!routeResult.isSuccess) {
        return Result.failure(
          routeResult.error ?? new Error('Failed to route interaction')
        );
      }

      // Add to session
      await this.addToSession(sessionId, request.interaction);

      let response: string | Record<string, unknown> | undefined;
      if (typeof routeResult.value === 'string') {
        response = routeResult.value;
      } else if (typeof routeResult.value === 'object' && routeResult.value !== null) {
        response = routeResult.value as Record<string, unknown>;
      }

      return Result.success({
        sessionId,
        interactionId,
        accepted: true,
        response,
        metadata: request.metadata,
      });
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to process interaction');
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async getSession(sessionId: string, userId: string): Promise<IResult<InteractionSession>> {
    try {
      const session = await this.sessionService.getSession(sessionId, userId);
      if (!session) {
        return Result.failure(new Error('Session not found'));
      }
      return Result.success(session);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async createSession(userId: string, companionId: string): Promise<IResult<InteractionSession>> {
    try {
      const sessionId = `session_${userId}_${companionId}_${Date.now()}`;
      // Placeholder context - in real implementation, this should be assembled properly
      const session: InteractionSession = {
        id: sessionId,
        userId,
        companionId,
        state: InteractionSessionState.INITIATED,
        startedAt: new Date(),
        interactions: [],
        context: {
          requestId: sessionId,
          userId,
          companionId,
          generatedAt: new Date().toISOString(),
          user: { available: false },
          companion: { available: false },
          world: { available: false },
          relationship: { available: false },
          memories: { available: false, count: 0, items: [] },
          moments: { available: false, count: 0, items: [] },
          meta: {
            timezone: 'UTC',
            referenceDate: new Date().toISOString(),
            degraded: [],
            providers: [],
            buildDurationMs: 0,
          },
        },
      };

      await this.sessionService.createSession(session);
      this.logger.info({ sessionId, userId, companionId }, 'Created interaction session');
      return Result.success(session);
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to create session');
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async endSession(sessionId: string, userId: string): Promise<IResult<InteractionSessionSummary>> {
    try {
      const session = await this.sessionService.getSession(sessionId, userId);
      if (!session) {
        return Result.failure(new Error('Session not found'));
      }

      const now = new Date();
      session.state = InteractionSessionState.COMPLETED;
      session.endedAt = now;

      await this.sessionService.updateSession(session);
      await this.sessionService.deleteSession(sessionId);

      const totalDurationMs = session.endedAt.getTime() - session.startedAt.getTime();
      const interactionTypes = [...new Set(session.interactions.map(i => i.type))];

      const summary: InteractionSessionSummary = {
        sessionId,
        userId: session.userId,
        companionId: session.companionId,
        duration: totalDurationMs,
        interactionCount: session.interactions.length,
        interactionTypes,
        startedAt: session.startedAt,
        endedAt: now,
        totalDurationMs,
      };

      this.logger.info(
        { sessionId, interactionCount: session.interactions.length },
        'Ended interaction session'
      );
      return Result.success(summary);
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to end session');
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async getSessionHistory(
    sessionId: string,
    userId: string,
    limit: number = 10
  ): Promise<IResult<AnyInteraction[]>> {
    try {
      const history = await this.sessionService.getSessionHistory(sessionId, userId, limit);
      return Result.success(history);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async getSessionSummary(
    sessionId: string,
    userId: string
  ): Promise<IResult<InteractionSessionSummary>> {
    try {
      const session = await this.sessionService.getSession(sessionId, userId);
      if (!session) {
        return Result.failure(new Error('Session not found'));
      }

      const endTime = session.endedAt || new Date();
      const totalDurationMs = endTime.getTime() - session.startedAt.getTime();
      const interactionTypes = [...new Set(session.interactions.map(i => i.type))];

      const summary: InteractionSessionSummary = {
        sessionId,
        userId: session.userId,
        companionId: session.companionId,
        duration: totalDurationMs,
        interactionCount: session.interactions.length,
        interactionTypes,
        startedAt: session.startedAt,
        endedAt: endTime,
        totalDurationMs,
      };

      return Result.success(summary);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async routeInteraction(request: ProcessInteractionRequest): Promise<IResult<unknown>> {
    const { interaction, context } = request;

    switch (interaction.type) {
      case InteractionType.TEXT_CHAT:
        return this.conversationManager.processMessage(
          interaction as any,
          context
        );
      case InteractionType.VOICE_CALL:
        await this.voiceManager.handleCallState(interaction as any);
        return Result.success('Voice call handled');
      case InteractionType.ACTIVITY:
        await this.activityManager.startActivity(interaction as any, context);
        return Result.success('Activity started');
      case InteractionType.PRESENCE:
        await this.presenceManager.updatePresence(interaction as any, context);
        return Result.success('Presence updated');
      case InteractionType.TYPING:
        await this.typingManager.reportTyping(interaction as any);
        return Result.success('Typing reported');
      case InteractionType.STREAMING:
        await this.streamingManager.startStream(interaction as any, context);
        return Result.success('Stream started');
      case InteractionType.INTERRUPTION:
        await this.interruptionManager.handleInterruption(interaction as any);
        return Result.success('Interruption handled');
      case InteractionType.SILENCE:
        await this.silenceManager.recordSilence(interaction as any);
        return Result.success('Silence recorded');
      default:
        return Result.failure(new Error(`Unknown interaction type: ${(interaction as any).type}`));
    }
  }

  private async addToSession(sessionId: string, interaction: AnyInteraction): Promise<void> {
    await this.sessionService.addInteraction(sessionId, interaction);
  }
}
