/**
 * Reconnect Manager
 * Manages socket reconnection logic and recovery
 */

import { ReconnectData } from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface ReconnectAttempt {
  previousSocketId: string;
  userId: string;
  sessionId: string;
  attemptCount: number;
  firstAttemptAt: Date;
  lastAttemptAt: Date;
  nextRetryAt: Date;
  isResolved: boolean;
  newSocketId?: string;
  resolvedAt?: Date;
}

export class ReconnectManager {
  private logger = createLogger(this.constructor.name);
  private reconnectAttempts = new Map<string, ReconnectAttempt>();
  private userReconnects = new Map<string, Set<string>>();
  private sessionReconnects = new Map<string, Set<string>>();
  private baseRetryDelay = 1000; // 1 second
  private maxRetryDelay = 30000; // 30 seconds
  private maxAttempts = 5;
  private attemptTTL = 5 * 60 * 1000; // 5 minutes

  initiateReconnect(
    previousSocketId: string,
    userId: string,
    sessionId: string
  ): ReconnectAttempt {
    const attemptId = uuidv4();
    const now = new Date();

    const attempt: ReconnectAttempt = {
      previousSocketId,
      userId,
      sessionId,
      attemptCount: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      nextRetryAt: new Date(now.getTime() + this.baseRetryDelay),
      isResolved: false,
    };

    this.reconnectAttempts.set(attemptId, attempt);

    if (!this.userReconnects.has(userId)) {
      this.userReconnects.set(userId, new Set());
    }
    this.userReconnects.get(userId)!.add(attemptId);

    if (!this.sessionReconnects.has(sessionId)) {
      this.sessionReconnects.set(sessionId, new Set());
    }
    this.sessionReconnects.get(sessionId)!.add(attemptId);

    this.logger.info(
      `Reconnect initiated for user ${userId} (socket: ${previousSocketId})`
    );

    return attempt;
  }

  recordReconnectAttempt(attemptId: string): ReconnectAttempt | null {
    const attempt = this.reconnectAttempts.get(attemptId);

    if (!attempt || attempt.isResolved) {
      return null;
    }

    attempt.attemptCount++;
    const now = new Date();
    attempt.lastAttemptAt = now;

    if (attempt.attemptCount > this.maxAttempts) {
      attempt.isResolved = true;
      attempt.resolvedAt = now;
      this.logger.warn(`Reconnect failed: max attempts exceeded for ${attemptId}`);
      return attempt;
    }

    const nextDelay = Math.min(
      this.baseRetryDelay * Math.pow(2, attempt.attemptCount - 1),
      this.maxRetryDelay
    );

    attempt.nextRetryAt = new Date(now.getTime() + nextDelay);

    this.reconnectAttempts.set(attemptId, attempt);

    this.logger.debug(
      `Reconnect attempt ${attempt.attemptCount} recorded for ${attemptId}`
    );

    return attempt;
  }

  resolveReconnect(attemptId: string, newSocketId: string): ReconnectAttempt | null {
    const attempt = this.reconnectAttempts.get(attemptId);

    if (!attempt) {
      return null;
    }

    const now = new Date();

    attempt.isResolved = true;
    attempt.newSocketId = newSocketId;
    attempt.resolvedAt = now;

    this.reconnectAttempts.set(attemptId, attempt);

    this.logger.info(
      `Reconnect resolved: ${attempt.previousSocketId} -> ${newSocketId}`
    );

    return attempt;
  }

  getReconnectAttempt(attemptId: string): ReconnectAttempt | null {
    return this.reconnectAttempts.get(attemptId) || null;
  }

  getActiveReconnectAttempts(): ReconnectAttempt[] {
    return Array.from(this.reconnectAttempts.values()).filter(a => !a.isResolved);
  }

  getUserReconnectAttempts(userId: string): ReconnectAttempt[] {
    const attemptIds = this.userReconnects.get(userId) || new Set();
    const attempts: ReconnectAttempt[] = [];

    for (const attemptId of attemptIds) {
      const attempt = this.reconnectAttempts.get(attemptId);
      if (attempt) {
        attempts.push(attempt);
      }
    }

    return attempts;
  }

  getSessionReconnectAttempts(sessionId: string): ReconnectAttempt[] {
    const attemptIds = this.sessionReconnects.get(sessionId) || new Set();
    const attempts: ReconnectAttempt[] = [];

    for (const attemptId of attemptIds) {
      const attempt = this.reconnectAttempts.get(attemptId);
      if (attempt) {
        attempts.push(attempt);
      }
    }

    return attempts;
  }

  canRetry(attemptId: string): boolean {
    const attempt = this.reconnectAttempts.get(attemptId);

    if (!attempt || attempt.isResolved) {
      return false;
    }

    if (attempt.attemptCount >= this.maxAttempts) {
      return false;
    }

    const now = new Date();
    return now >= attempt.nextRetryAt;
  }

  getNextRetryTime(attemptId: string): Date | null {
    const attempt = this.reconnectAttempts.get(attemptId);

    if (!attempt || attempt.isResolved) {
      return null;
    }

    return attempt.nextRetryAt;
  }

  failReconnect(attemptId: string, reason?: string): ReconnectAttempt | null {
    const attempt = this.reconnectAttempts.get(attemptId);

    if (!attempt) {
      return null;
    }

    attempt.isResolved = true;
    attempt.resolvedAt = new Date();

    if (reason) {
      attempt.userId = attempt.userId; // Placeholder to avoid unused - in real implementation would store reason
    }

    this.reconnectAttempts.set(attemptId, attempt);

    this.logger.warn(`Reconnect failed: ${attemptId} - ${reason || 'unknown'}`);

    return attempt;
  }

  removeReconnectAttempt(attemptId: string): boolean {
    const attempt = this.reconnectAttempts.get(attemptId);

    if (!attempt) {
      return false;
    }

    this.reconnectAttempts.delete(attemptId);

    const userAttempts = this.userReconnects.get(attempt.userId);
    if (userAttempts) {
      userAttempts.delete(attemptId);
    }

    const sessionAttempts = this.sessionReconnects.get(attempt.sessionId);
    if (sessionAttempts) {
      sessionAttempts.delete(attemptId);
    }

    this.logger.debug(`Reconnect attempt removed: ${attemptId}`);

    return true;
  }

  cleanupExpiredAttempts(): string[] {
    const now = new Date();
    const expiredAttempts: string[] = [];

    for (const [attemptId, attempt] of this.reconnectAttempts.entries()) {
      const age = now.getTime() - attempt.firstAttemptAt.getTime();

      if (age > this.attemptTTL) {
        this.removeReconnectAttempt(attemptId);
        expiredAttempts.push(attemptId);

        this.logger.debug(`Reconnect attempt expired: ${attemptId}`);
      }
    }

    return expiredAttempts;
  }

  getReconnectData(attemptId: string): ReconnectData | null {
    const attempt = this.reconnectAttempts.get(attemptId);

    if (!attempt) {
      return null;
    }

    return {
      previousSocketId: attempt.previousSocketId,
      newSocketId: attempt.newSocketId || '',
      reconnectAttempt: attempt.attemptCount,
      lastConnectedAt: attempt.firstAttemptAt,
      reconnectAt: attempt.lastAttemptAt,
    };
  }

  getReconnectCount(): number {
    return this.reconnectAttempts.size;
  }

  getActiveReconnectCount(): number {
    return Array.from(this.reconnectAttempts.values()).filter(a => !a.isResolved).length;
  }

  getResolvedReconnectCount(): number {
    return Array.from(this.reconnectAttempts.values()).filter(a => a.isResolved).length;
  }
}
