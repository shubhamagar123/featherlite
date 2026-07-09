/**
 * Typing Manager
 * Manages typing indicators and user typing state
 */

import { TypingData } from '../types';
import { createLogger } from '@utils/logger';

interface TypingSession {
  userId: string;
  roomId: string;
  startedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export class TypingManager {
  private logger = createLogger(this.constructor.name);
  private typingSessions = new Map<string, TypingSession>();
  private roomTyping = new Map<string, Set<string>>();
  private typingTimeout = 5000; // 5 seconds

  setUserTyping(userId: string, roomId: string): TypingData {
    const sessionKey = `${userId}:${roomId}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.typingTimeout);

    const typingSession: TypingSession = {
      userId,
      roomId,
      startedAt: now,
      expiresAt,
      isActive: true,
    };

    this.typingSessions.set(sessionKey, typingSession);

    if (!this.roomTyping.has(roomId)) {
      this.roomTyping.set(roomId, new Set());
    }
    this.roomTyping.get(roomId)!.add(userId);

    this.logger.debug(`User typing: ${userId} in room ${roomId}`);

    return {
      userId,
      roomId,
      startedAt: now,
      isActive: true,
    };
  }

  updateUserTyping(userId: string, roomId: string): boolean {
    const sessionKey = `${userId}:${roomId}`;
    const session = this.typingSessions.get(sessionKey);

    if (!session) {
      return false;
    }

    const now = new Date();
    session.expiresAt = new Date(now.getTime() + this.typingTimeout);
    this.typingSessions.set(sessionKey, session);

    return true;
  }

  setUserStoppedTyping(userId: string, roomId: string): boolean {
    const sessionKey = `${userId}:${roomId}`;

    if (this.typingSessions.has(sessionKey)) {
      this.typingSessions.delete(sessionKey);
    }

    const roomUsers = this.roomTyping.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId);
    }

    this.logger.debug(`User stopped typing: ${userId} in room ${roomId}`);
    return true;
  }

  getUserTypingData(userId: string, roomId: string): TypingData | null {
    const sessionKey = `${userId}:${roomId}`;
    const session = this.typingSessions.get(sessionKey);

    if (!session) {
      return null;
    }

    return {
      userId,
      roomId,
      startedAt: session.startedAt,
      isActive: session.isActive,
    };
  }

  getRoomTypingUsers(roomId: string): string[] {
    const typingUsers = this.roomTyping.get(roomId) || new Set();
    return Array.from(typingUsers);
  }

  getTypingUsersData(roomId: string): TypingData[] {
    const typingUsers = this.roomTyping.get(roomId) || new Set();
    const typingData: TypingData[] = [];

    for (const userId of typingUsers) {
      const data = this.getUserTypingData(userId, roomId);
      if (data) {
        typingData.push(data);
      }
    }

    return typingData;
  }

  cleanupExpiredTyping(): string[] {
    const now = new Date();
    const expiredSessionKeys: string[] = [];

    for (const [sessionKey, session] of this.typingSessions.entries()) {
      if (now > session.expiresAt) {
        this.typingSessions.delete(sessionKey);
        expiredSessionKeys.push(sessionKey);

        const roomUsers = this.roomTyping.get(session.roomId);
        if (roomUsers) {
          roomUsers.delete(session.userId);
        }

        this.logger.debug(`Typing session expired: ${sessionKey}`);
      }
    }

    return expiredSessionKeys;
  }

  removeUserFromRoom(userId: string, roomId: string): boolean {
    return this.setUserStoppedTyping(userId, roomId);
  }

  removeUserFromAllRooms(userId: string): number {
    let removedCount = 0;

    for (const [sessionKey] of this.typingSessions.entries()) {
      const [sUserId, roomId] = sessionKey.split(':');
      if (sUserId === userId) {
        this.setUserStoppedTyping(userId, roomId);
        removedCount++;
      }
    }

    return removedCount;
  }

  isUserTyping(userId: string, roomId: string): boolean {
    const sessionKey = `${userId}:${roomId}`;
    return this.typingSessions.has(sessionKey);
  }

  getTypingCount(): number {
    return this.typingSessions.size;
  }

  getTypingUsersCount(roomId: string): number {
    return (this.roomTyping.get(roomId) || new Set()).size;
  }
}
