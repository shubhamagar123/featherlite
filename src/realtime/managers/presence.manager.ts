/**
 * Presence Manager
 * Tracks and manages user presence status
 */

import { PresenceData, PresenceStatus } from '../types';
import { createLogger } from '@utils/logger';

export class PresenceManager {
  private logger = createLogger(this.constructor.name);
  private presence = new Map<string, PresenceData>();
  private typingUsers = new Map<string, Set<string>>();

  setPresence(
    userId: string,
    status: PresenceStatus,
    companionId?: string,
    metadata?: Record<string, any>
  ): PresenceData {
    const presenceData: PresenceData = {
      userId,
      status,
      companionId,
      lastSeen: new Date(),
      voiceActive: status === PresenceStatus.VOICE,
      metadata: metadata || {},
    };

    this.presence.set(userId, presenceData);

    this.logger.debug(`Presence set: ${userId} -> ${status}`);
    return presenceData;
  }

  getPresence(userId: string): PresenceData | null {
    return this.presence.get(userId) || null;
  }

  updatePresenceStatus(userId: string, status: PresenceStatus): PresenceData | null {
    const presence = this.presence.get(userId);

    if (!presence) {
      return null;
    }

    presence.status = status;
    presence.lastSeen = new Date();
    presence.voiceActive = status === PresenceStatus.VOICE;

    this.presence.set(userId, presence);

    return presence;
  }

  setUserOffline(userId: string): boolean {
    const presence = this.presence.get(userId);

    if (!presence) {
      return false;
    }

    presence.status = PresenceStatus.OFFLINE;
    presence.lastSeen = new Date();
    this.presence.set(userId, presence);

    this.typingUsers.delete(userId);

    this.logger.debug(`User set offline: ${userId}`);
    return true;
  }

  setUserTyping(userId: string, roomId: string): boolean {
    const presence = this.presence.get(userId);

    if (!presence) {
      return false;
    }

    presence.status = PresenceStatus.TYPING;
    presence.typingIn = roomId;
    this.presence.set(userId, presence);

    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }
    this.typingUsers.get(roomId)!.add(userId);

    return true;
  }

  setUserStoppedTyping(userId: string): boolean {
    const presence = this.presence.get(userId);

    if (!presence) {
      return false;
    }

    if (presence.typingIn) {
      const typingInRoom = this.typingUsers.get(presence.typingIn);
      if (typingInRoom) {
        typingInRoom.delete(userId);
      }
    }

    presence.typingIn = undefined;
    if (presence.status === PresenceStatus.TYPING) {
      presence.status = PresenceStatus.ONLINE;
    }
    this.presence.set(userId, presence);

    return true;
  }

  getTypingUsers(roomId: string): string[] {
    const typingSet = this.typingUsers.get(roomId) || new Set();
    return Array.from(typingSet);
  }

  setUserVoiceActive(userId: string, active: boolean): boolean {
    const presence = this.presence.get(userId);

    if (!presence) {
      return false;
    }

    presence.voiceActive = active;
    if (active) {
      presence.status = PresenceStatus.VOICE;
    } else if (presence.status === PresenceStatus.VOICE) {
      presence.status = PresenceStatus.ONLINE;
    }
    this.presence.set(userId, presence);

    return true;
  }

  getAllPresence(): PresenceData[] {
    return Array.from(this.presence.values());
  }

  getOnlineUsers(): PresenceData[] {
    return Array.from(this.presence.values())
      .filter(p => p.status !== PresenceStatus.OFFLINE);
  }

  getOfflineUsers(): PresenceData[] {
    return Array.from(this.presence.values())
      .filter(p => p.status === PresenceStatus.OFFLINE);
  }

  getPresenceCount(): number {
    return this.presence.size;
  }

  getOnlineCount(): number {
    return this.getOnlineUsers().length;
  }

  removePresence(userId: string): boolean {
    if (this.presence.has(userId)) {
      const presence = this.presence.get(userId)!;

      if (presence.typingIn) {
        const typingInRoom = this.typingUsers.get(presence.typingIn);
        if (typingInRoom) {
          typingInRoom.delete(userId);
        }
      }

      this.presence.delete(userId);
      this.logger.debug(`Presence removed: ${userId}`);
      return true;
    }

    return false;
  }

  isUserOnline(userId: string): boolean {
    const presence = this.presence.get(userId);
    return presence?.status !== PresenceStatus.OFFLINE;
  }
}
