/**
 * Session Repository
 * Persistence layer for session management
 */

import { Session, SessionStatus } from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SessionRepository {
  private logger = createLogger(this.constructor.name);
  private sessions = new Map<string, Session>();

  async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const id = uuidv4();
    const newSession: Session = { ...session, id };

    this.sessions.set(id, newSession);
    this.logger.debug(`Session created: ${id} for user ${session.userId}`);

    return newSession;
  }

  async getSessionById(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.debug(`Session not found: ${sessionId}`);
      return null;
    }
    return session;
  }

  async getSessionsByUserId(userId: string): Promise<Session[]> {
    const sessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.status === SessionStatus.ACTIVE);

    this.logger.debug(`Found ${sessions.length} active sessions for user ${userId}`);
    return sessions;
  }

  async getSessionsByDeviceId(deviceId: string): Promise<Session[]> {
    const sessions = Array.from(this.sessions.values())
      .filter(s => s.deviceId === deviceId && s.status === SessionStatus.ACTIVE);

    return sessions;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Session not found for update: ${sessionId}`);
      return null;
    }

    const updatedSession = { ...session, ...updates };
    this.sessions.set(sessionId, updatedSession);

    this.logger.debug(`Session updated: ${sessionId}`);
    return updatedSession;
  }

  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = status;
    this.sessions.set(sessionId, session);

    this.logger.debug(`Session status updated: ${sessionId} -> ${status}`);
    return true;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.logger.debug(`Session deleted: ${sessionId}`);
    }
    return deleted;
  }

  async deleteSessionsByUserId(userId: string): Promise<number> {
    const sessionIds = Array.from(this.sessions.entries())
      .filter(([, session]) => session.userId === userId)
      .map(([id]) => id);

    sessionIds.forEach(id => this.sessions.delete(id));

    this.logger.debug(`Deleted ${sessionIds.length} sessions for user ${userId}`);
    return sessionIds.length;
  }

  async expireIdleSessions(idleTimeoutMinutes: number): Promise<number> {
    const now = new Date();
    let expiredCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const idleTime = now.getTime() - session.lastActiveAt.getTime();
      const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;

      if (idleTime > idleTimeoutMs && session.status === SessionStatus.ACTIVE) {
        session.status = SessionStatus.EXPIRED;
        this.sessions.set(sessionId, session);
        expiredCount++;
      }
    }

    this.logger.debug(`Expired ${expiredCount} idle sessions`);
    return expiredCount;
  }

  async expireExpiredSessions(): Promise<number> {
    const now = new Date();
    let expiredCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now && session.status === SessionStatus.ACTIVE) {
        session.status = SessionStatus.EXPIRED;
        this.sessions.set(sessionId, session);
        expiredCount++;
      }
    }

    this.logger.debug(`Expired ${expiredCount} sessions by TTL`);
    return expiredCount;
  }

  async getActiveSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(s => s.status === SessionStatus.ACTIVE);
  }

  async getSessionCount(): Promise<number> {
    return this.sessions.size;
  }

  async getActiveSessionCount(): Promise<number> {
    return Array.from(this.sessions.values())
      .filter(s => s.status === SessionStatus.ACTIVE).length;
  }
}
