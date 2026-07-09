/**
 * Session Manager
 * Manages session lifecycle and tracking
 */

import {
  Session,
  SessionStatus,
  AuthenticationToken,
  RefreshToken,
  SessionMetadata,
} from '../types';
import { SessionRepository } from '../repositories/session.repository';
import { TokenManager } from './token.manager';
import { createLogger } from '@utils/logger';

export class SessionManager {
  private logger = createLogger(this.constructor.name);
  private sessionRepo: SessionRepository;
  private sessionTTL = 24 * 60 * 60 * 1000; // 24 hours
  private idleTimeout = 30 * 60 * 1000; // 30 minutes

  constructor(sessionRepo: SessionRepository, _tokenManager: TokenManager) {
    this.sessionRepo = sessionRepo;
  }

  async createSession(
    userId: string,
    deviceId: string,
    accessToken: AuthenticationToken,
    refreshToken: RefreshToken,
    metadata: SessionMetadata,
    correlationId: string
  ): Promise<Session> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTTL);
    const idleTimeoutAt = new Date(now.getTime() + this.idleTimeout);

    const session: Omit<Session, 'id'> = {
      userId,
      deviceId,
      status: SessionStatus.ACTIVE,
      accessToken,
      refreshToken,
      createdAt: now,
      expiresAt,
      lastActiveAt: now,
      idleTimeoutAt,
      correlationId,
      metadata,
    };

    const createdSession = await this.sessionRepo.createSession(session);

    this.logger.info(
      `Session created: ${createdSession.id} for user ${userId} on device ${deviceId}`
    );

    return createdSession;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = await this.sessionRepo.getSessionById(sessionId);

    if (!session) {
      return null;
    }

    if (this.isSessionExpired(session)) {
      await this.expireSession(sessionId);
      return null;
    }

    return session;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const sessions = await this.sessionRepo.getSessionsByUserId(userId);

    const validSessions = sessions.filter(s => !this.isSessionExpired(s));

    for (const session of sessions) {
      if (this.isSessionExpired(session)) {
        await this.expireSession(session.id);
      }
    }

    return validSessions;
  }

  async updateSessionActivity(sessionId: string): Promise<Session | null> {
    const session = await this.sessionRepo.getSessionById(sessionId);

    if (!session) {
      return null;
    }

    if (this.isSessionExpired(session)) {
      await this.expireSession(sessionId);
      return null;
    }

    const now = new Date();
    const updated = await this.sessionRepo.updateSession(sessionId, {
      lastActiveAt: now,
      idleTimeoutAt: new Date(now.getTime() + this.idleTimeout),
    });

    return updated;
  }

  async rotateSessionToken(sessionId: string, newAccessToken: AuthenticationToken): Promise<Session | null> {
    const session = await this.sessionRepo.getSessionById(sessionId);

    if (!session) {
      return null;
    }

    const updated = await this.sessionRepo.updateSession(sessionId, {
      accessToken: newAccessToken,
    });

    this.logger.debug(`Session token rotated: ${sessionId}`);
    return updated;
  }

  async expireSession(sessionId: string): Promise<void> {
    await this.sessionRepo.updateSessionStatus(sessionId, SessionStatus.EXPIRED);
    this.logger.info(`Session expired: ${sessionId}`);
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepo.updateSessionStatus(sessionId, SessionStatus.REVOKED);
    this.logger.info(`Session revoked: ${sessionId}`);
  }

  async revokeUserSessions(userId: string, excludeSessionId?: string): Promise<number> {
    const sessions = await this.sessionRepo.getSessionsByUserId(userId);

    let revokedCount = 0;
    for (const session of sessions) {
      if (excludeSessionId !== session.id) {
        await this.revokeSession(session.id);
        revokedCount++;
      }
    }

    this.logger.info(`Revoked ${revokedCount} sessions for user ${userId}`);
    return revokedCount;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    return this.revokeUserSessions(userId);
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expiredByTTL = await this.sessionRepo.expireExpiredSessions();
    const expiredByIdle = await this.sessionRepo.expireIdleSessions(
      this.idleTimeout / (60 * 1000)
    );

    const totalExpired = expiredByTTL + expiredByIdle;
    this.logger.debug(`Cleaned up ${totalExpired} expired sessions`);

    return totalExpired;
  }

  private isSessionExpired(session: Session): boolean {
    const now = new Date();
    return (
      session.status === SessionStatus.EXPIRED ||
      session.status === SessionStatus.REVOKED ||
      now > session.expiresAt
    );
  }

  async getActiveSessions(): Promise<Session[]> {
    return this.sessionRepo.getActiveSessions();
  }

  async getSessionCount(): Promise<number> {
    return this.sessionRepo.getActiveSessionCount();
  }
}
