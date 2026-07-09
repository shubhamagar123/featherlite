import Redis from 'ioredis';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { InteractionSession, AnyInteraction } from '../dtos/interaction.dtos';
import { InteractionSessionState } from '../enums/interaction.enums';

/**
 * Redis-backed session storage for InteractionOrchestrator.
 * Sessions are stored as Redis hashes with a configurable TTL (default 24h).
 */
export class RedisSessionService {
  private readonly logger: Logger;
  private readonly defaultTtlSeconds = 24 * 60 * 60;

  constructor(private redisClient: Redis) {
    this.logger = createLogger('RedisSessionService');
  }

  /**
   * Get a session by ID and verify ownership.
   */
  async getSession(sessionId: string, userId: string): Promise<InteractionSession | null> {
    try {
      const data = await this.redisClient.hgetall(this.getSessionKey(sessionId));

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      if (data.userId !== userId) {
        this.logger.warn({ sessionId, userId }, 'Session ownership mismatch');
        return null;
      }

      return this.deserializeSession(data);
    } catch (error) {
      this.logger.error({ error, sessionId }, 'Failed to get session from Redis');
      return null;
    }
  }

  /**
   * Create and store a new session with default TTL.
   */
  async createSession(session: InteractionSession): Promise<void> {
    try {
      const data = this.serializeSession(session);
      const key = this.getSessionKey(session.id);

      await this.redisClient.hset(key, data);
      await this.redisClient.expire(key, this.defaultTtlSeconds);

      this.logger.info(
        {
          sessionId: session.id,
          userId: session.userId,
          ttlSeconds: this.defaultTtlSeconds,
        },
        'Stored session in Redis'
      );
    } catch (error) {
      this.logger.error({ error, sessionId: session.id }, 'Failed to create session in Redis');
    }
  }

  /**
   * Update an existing session.
   */
  async updateSession(session: InteractionSession): Promise<void> {
    try {
      const data = this.serializeSession(session);
      const key = this.getSessionKey(session.id);

      await this.redisClient.hset(key, data);
      await this.redisClient.expire(key, this.defaultTtlSeconds);

      this.logger.debug({ sessionId: session.id }, 'Updated session in Redis');
    } catch (error) {
      this.logger.error({ error, sessionId: session.id }, 'Failed to update session in Redis');
    }
  }

  /**
   * Delete a session (called on endSession).
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = this.getSessionKey(sessionId);
      await this.redisClient.del(key);

      this.logger.info({ sessionId }, 'Deleted session from Redis');
    } catch (error) {
      this.logger.error({ error, sessionId }, 'Failed to delete session from Redis');
    }
  }

  /**
   * Add an interaction to a session's history.
   */
  async addInteraction(sessionId: string, interaction: AnyInteraction): Promise<void> {
    try {
      const session = await this.getSession(sessionId, (interaction as any).userId);
      if (!session) {
        this.logger.warn({ sessionId }, 'Session not found when adding interaction');
        return;
      }

      session.interactions.push(interaction);
      await this.updateSession(session);
    } catch (error) {
      this.logger.error({ error, sessionId }, 'Failed to add interaction to session');
    }
  }

  /**
   * Get session history (last N interactions).
   */
  async getSessionHistory(sessionId: string, userId: string, limit: number = 10): Promise<AnyInteraction[]> {
    try {
      const session = await this.getSession(sessionId, userId);
      if (!session) {
        return [];
      }

      return session.interactions.slice(-limit);
    } catch (error) {
      this.logger.error({ error, sessionId }, 'Failed to get session history');
      return [];
    }
  }

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private serializeSession(session: InteractionSession): Record<string, string> {
    return {
      id: session.id,
      userId: session.userId,
      companionId: session.companionId,
      state: String(session.state),
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? '',
      interactions: JSON.stringify(session.interactions),
      context: JSON.stringify(session.context),
    };
  }

  private deserializeSession(data: Record<string, string>): InteractionSession {
    return {
      id: data.id,
      userId: data.userId,
      companionId: data.companionId,
      state: parseInt(data.state, 10) as unknown as InteractionSessionState,
      startedAt: new Date(data.startedAt),
      endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      interactions: JSON.parse(data.interactions || '[]') as AnyInteraction[],
      context: JSON.parse(data.context || '{}'),
    };
  }
}
