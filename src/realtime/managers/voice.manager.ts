/**
 * Voice Manager
 * Manages voice data streaming and voice communication state
 */

import { VoiceData } from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface VoiceSession {
  sessionId: string;
  userId: string;
  interactionId: string;
  startedAt: Date;
  lastChunkAt: Date;
  chunkCount: number;
  totalBytes: number;
  isActive: boolean;
}

export class VoiceManager {
  private logger = createLogger(this.constructor.name);
  private voiceSessions = new Map<string, VoiceSession>();
  private voiceChunks = new Map<string, VoiceData[]>();
  private userVoiceSessions = new Map<string, Set<string>>();

  startVoiceSession(
    userId: string,
    _sessionId: string,
    interactionId: string
  ): VoiceSession {
    const voiceSessionId = uuidv4();
    const now = new Date();

    const voiceSession: VoiceSession = {
      sessionId: voiceSessionId,
      userId,
      interactionId,
      startedAt: now,
      lastChunkAt: now,
      chunkCount: 0,
      totalBytes: 0,
      isActive: true,
    };

    this.voiceSessions.set(voiceSessionId, voiceSession);
    this.voiceChunks.set(voiceSessionId, []);

    if (!this.userVoiceSessions.has(userId)) {
      this.userVoiceSessions.set(userId, new Set());
    }
    this.userVoiceSessions.get(userId)!.add(voiceSessionId);

    this.logger.debug(`Voice session started: ${voiceSessionId} for user ${userId}`);

    return voiceSession;
  }

  getVoiceSession(voiceSessionId: string): VoiceSession | null {
    return this.voiceSessions.get(voiceSessionId) || null;
  }

  getUserVoiceSessions(userId: string): VoiceSession[] {
    const sessionIds = this.userVoiceSessions.get(userId) || new Set();
    const sessions: VoiceSession[] = [];

    for (const sessionId of sessionIds) {
      const session = this.voiceSessions.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  getActiveVoiceSessions(): VoiceSession[] {
    return Array.from(this.voiceSessions.values()).filter(s => s.isActive);
  }

  addVoiceChunk(voiceSessionId: string, chunk: VoiceData): VoiceSession | null {
    const session = this.voiceSessions.get(voiceSessionId);

    if (!session) {
      return null;
    }

    const chunks = this.voiceChunks.get(voiceSessionId) || [];
    chunks.push(chunk);
    this.voiceChunks.set(voiceSessionId, chunks);

    session.lastChunkAt = new Date();
    session.chunkCount++;
    session.totalBytes += chunk.audio.length;

    this.voiceSessions.set(voiceSessionId, session);

    return session;
  }

  getVoiceChunks(voiceSessionId: string): VoiceData[] {
    return this.voiceChunks.get(voiceSessionId) || [];
  }

  getVoiceChunksSince(voiceSessionId: string, timestamp: Date): VoiceData[] {
    const chunks = this.voiceChunks.get(voiceSessionId) || [];

    return chunks.filter(chunk => chunk.timestamp > timestamp);
  }

  getVoiceAudioBuffer(voiceSessionId: string): Buffer | null {
    const chunks = this.voiceChunks.get(voiceSessionId);

    if (!chunks || chunks.length === 0) {
      return null;
    }

    return Buffer.concat(chunks.map(c => c.audio));
  }

  updateVoiceSessionActivity(voiceSessionId: string): VoiceSession | null {
    const session = this.voiceSessions.get(voiceSessionId);

    if (!session) {
      return null;
    }

    session.lastChunkAt = new Date();
    this.voiceSessions.set(voiceSessionId, session);

    return session;
  }

  endVoiceSession(voiceSessionId: string): VoiceSession | null {
    const session = this.voiceSessions.get(voiceSessionId);

    if (!session) {
      return null;
    }

    session.isActive = false;
    this.voiceSessions.set(voiceSessionId, session);

    this.logger.debug(`Voice session ended: ${voiceSessionId}`);
    return session;
  }

  removeVoiceSession(voiceSessionId: string): boolean {
    const session = this.voiceSessions.get(voiceSessionId);

    if (!session) {
      return false;
    }

    this.voiceSessions.delete(voiceSessionId);
    this.voiceChunks.delete(voiceSessionId);

    const userSessions = this.userVoiceSessions.get(session.userId);
    if (userSessions) {
      userSessions.delete(voiceSessionId);
    }

    this.logger.debug(`Voice session removed: ${voiceSessionId}`);
    return true;
  }

  getVoiceSessionStats(voiceSessionId: string): {
    duration: number;
    chunkCount: number;
    totalBytes: number;
  } | null {
    const session = this.voiceSessions.get(voiceSessionId);

    if (!session) {
      return null;
    }

    const duration = session.lastChunkAt.getTime() - session.startedAt.getTime();

    return {
      duration,
      chunkCount: session.chunkCount,
      totalBytes: session.totalBytes,
    };
  }

  cleanupInactiveSessions(timeoutMs: number): string[] {
    const now = new Date();
    const inactiveSessions: string[] = [];

    for (const [sessionId, session] of this.voiceSessions.entries()) {
      const inactiveTime = now.getTime() - session.lastChunkAt.getTime();

      if (inactiveTime > timeoutMs && session.isActive) {
        this.endVoiceSession(sessionId);
        inactiveSessions.push(sessionId);

        this.logger.debug(`Voice session marked inactive: ${sessionId}`);
      }
    }

    return inactiveSessions;
  }

  getVoiceSessionCount(): number {
    return this.voiceSessions.size;
  }

  getActiveVoiceSessionCount(): number {
    return Array.from(this.voiceSessions.values()).filter(s => s.isActive).length;
  }
}
