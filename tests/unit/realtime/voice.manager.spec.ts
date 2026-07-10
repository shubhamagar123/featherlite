import { VoiceManager } from '@/realtime/managers/voice.manager';
import { VoiceData } from '@/realtime/types';

describe('VoiceManager', () => {
  let manager: VoiceManager;

  beforeEach(() => {
    manager = new VoiceManager();
  });

  const createVoiceData = (size: number = 1024, timestamp: Date = new Date()): VoiceData => ({
    audio: Buffer.alloc(size),
    timestamp,
    format: 'pcm',
  });

  describe('startVoiceSession', () => {
    it('should create a new voice session', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');

      expect(session).toBeDefined();
      expect(session.userId).toBe('user1');
      expect(session.interactionId).toBe('interaction1');
      expect(session.isActive).toBe(true);
      expect(session.chunkCount).toBe(0);
      expect(session.totalBytes).toBe(0);
    });

    it('should assign unique sessionId to each session', () => {
      const session1 = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const session2 = manager.startVoiceSession('user1', 'session1', 'interaction2');

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should track sessions by user ID', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const sessions = manager.getUserVoiceSessions('user1');

      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe(session.sessionId);
    });

    it('should set session as active', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');

      expect(session.isActive).toBe(true);
    });

    it('should initialize empty voice chunks array', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const chunks = manager.getVoiceChunks(session.sessionId);

      expect(chunks).toEqual([]);
    });

    it('should cleanup inactive sessions before starting new one', () => {
      const session1 = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const session1Id = session1.sessionId;

      manager.endVoiceSession(session1Id);

      const session2 = manager.startVoiceSession('user1', 'session1', 'interaction2');

      expect(manager.getVoiceSession(session1Id)).toBeNull();
      expect(manager.getVoiceSession(session2.sessionId)).not.toBeNull();
    });

    it('should ensure capacity before starting new session', () => {
      const MAX_SESSIONS = 500;

      for (let i = 0; i < MAX_SESSIONS; i++) {
        manager.startVoiceSession('user' + i, 'session1', 'interaction' + i);
      }

      expect(manager.getVoiceSessionCount()).toBe(MAX_SESSIONS);

      const newSession = manager.startVoiceSession('user999', 'session1', 'interaction999');
      expect(manager.getVoiceSessionCount()).toBe(MAX_SESSIONS);
      expect(newSession).toBeDefined();
    });
  });

  describe('getVoiceSession', () => {
    it('should return session if it exists', () => {
      const created = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const retrieved = manager.getVoiceSession(created.sessionId);

      expect(retrieved).toEqual(created);
    });

    it('should return null if session does not exist', () => {
      const retrieved = manager.getVoiceSession('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('addVoiceChunk', () => {
    it('should add voice chunk to session', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const chunk = createVoiceData(1024);

      const updated = manager.addVoiceChunk(session.sessionId, chunk);

      expect(updated).toBeDefined();
      expect(updated!.chunkCount).toBe(1);
      expect(updated!.totalBytes).toBe(1024);
    });

    it('should return null if session does not exist', () => {
      const chunk = createVoiceData(1024);
      const updated = manager.addVoiceChunk('non-existent-id', chunk);

      expect(updated).toBeNull();
    });

    it('should accumulate chunks', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');

      manager.addVoiceChunk(session.sessionId, createVoiceData(1024));
      manager.addVoiceChunk(session.sessionId, createVoiceData(2048));
      const updated = manager.addVoiceChunk(session.sessionId, createVoiceData(512));

      expect(updated!.chunkCount).toBe(3);
      expect(updated!.totalBytes).toBe(3584);
    });

    it('should reject when exceeding MAX_BYTES_PER_SESSION', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const MAX_SIZE = 50 * 1024 * 1024;

      const largeChunk = createVoiceData(MAX_SIZE);
      manager.addVoiceChunk(session.sessionId, largeChunk);

      const overLimitChunk = createVoiceData(1);

      expect(() => {
        manager.addVoiceChunk(session.sessionId, overLimitChunk);
      }).toThrow('Voice session size limit exceeded');
    });

    it('should reject when adding chunk would exceed limit', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const MAX_SIZE = 50 * 1024 * 1024;

      const almostMaxChunk = createVoiceData(MAX_SIZE - 100);
      manager.addVoiceChunk(session.sessionId, almostMaxChunk);

      const overLimitChunk = createVoiceData(200);

      expect(() => {
        manager.addVoiceChunk(session.sessionId, overLimitChunk);
      }).toThrow('Voice session size limit exceeded');
    });

    it('should update last chunk timestamp', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const before = new Date();
      const chunk = createVoiceData(1024);
      manager.addVoiceChunk(session.sessionId, chunk);
      const after = new Date();

      const updated = manager.getVoiceSession(session.sessionId)!;
      expect(updated.lastChunkAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updated.lastChunkAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getVoiceChunks', () => {
    it('should return all chunks for a session', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const chunk1 = createVoiceData(1024);
      const chunk2 = createVoiceData(2048);

      manager.addVoiceChunk(session.sessionId, chunk1);
      manager.addVoiceChunk(session.sessionId, chunk2);

      const chunks = manager.getVoiceChunks(session.sessionId);
      expect(chunks).toHaveLength(2);
    });

    it('should return empty array if session does not exist', () => {
      const chunks = manager.getVoiceChunks('non-existent-id');

      expect(chunks).toEqual([]);
    });

    it('should return empty array for new session', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const chunks = manager.getVoiceChunks(session.sessionId);

      expect(chunks).toEqual([]);
    });
  });

  describe('getVoiceChunksSince', () => {
    it('should return chunks after specified timestamp', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const before = new Date('2026-07-10T10:00:00Z');
      const after = new Date('2026-07-10T11:00:00Z');

      manager.addVoiceChunk(session.sessionId, createVoiceData(1024, new Date('2026-07-10T10:30:00Z')));
      manager.addVoiceChunk(session.sessionId, createVoiceData(1024, new Date('2026-07-10T11:30:00Z')));

      const chunks = manager.getVoiceChunksSince(session.sessionId, before);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should return empty array if no chunks since timestamp', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const future = new Date('2099-07-10T12:00:00Z');

      manager.addVoiceChunk(session.sessionId, createVoiceData(1024));

      const chunks = manager.getVoiceChunksSince(session.sessionId, future);
      expect(chunks).toEqual([]);
    });
  });

  describe('getVoiceAudioBuffer', () => {
    it('should concatenate all voice chunks into buffer', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const chunk1 = createVoiceData(100);
      const chunk2 = createVoiceData(200);

      manager.addVoiceChunk(session.sessionId, chunk1);
      manager.addVoiceChunk(session.sessionId, chunk2);

      const buffer = manager.getVoiceAudioBuffer(session.sessionId);
      expect(buffer).not.toBeNull();
      expect(buffer!.length).toBe(300);
    });

    it('should return null if session has no chunks', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const buffer = manager.getVoiceAudioBuffer(session.sessionId);

      expect(buffer).toBeNull();
    });

    it('should return null if session does not exist', () => {
      const buffer = manager.getVoiceAudioBuffer('non-existent-id');

      expect(buffer).toBeNull();
    });
  });

  describe('updateVoiceSessionActivity', () => {
    it('should update last chunk timestamp', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const originalTime = session.lastChunkAt;

      const delay = 100;
      await new Promise(resolve => setTimeout(resolve, delay));

      const updated = manager.updateVoiceSessionActivity(session.sessionId);
      expect(updated!.lastChunkAt.getTime()).toBeGreaterThan(originalTime.getTime());
    });

    it('should return null if session does not exist', () => {
      const updated = manager.updateVoiceSessionActivity('non-existent-id');

      expect(updated).toBeNull();
    });
  });

  describe('endVoiceSession', () => {
    it('should mark session as inactive', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const ended = manager.endVoiceSession(session.sessionId);

      expect(ended!.isActive).toBe(false);
    });

    it('should return null if session does not exist', () => {
      const ended = manager.endVoiceSession('non-existent-id');

      expect(ended).toBeNull();
    });

    it('should keep session in map after ending', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      manager.endVoiceSession(session.sessionId);

      const retrieved = manager.getVoiceSession(session.sessionId);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.isActive).toBe(false);
    });
  });

  describe('removeVoiceSession', () => {
    it('should remove session completely', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const removed = manager.removeVoiceSession(session.sessionId);

      expect(removed).toBe(true);
      expect(manager.getVoiceSession(session.sessionId)).toBeNull();
    });

    it('should remove associated voice chunks', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      manager.addVoiceChunk(session.sessionId, createVoiceData(1024));
      manager.removeVoiceSession(session.sessionId);

      const chunks = manager.getVoiceChunks(session.sessionId);
      expect(chunks).toEqual([]);
    });

    it('should remove session from user mapping', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      manager.removeVoiceSession(session.sessionId);

      const userSessions = manager.getUserVoiceSessions('user1');
      expect(userSessions).toHaveLength(0);
    });

    it('should return false if session does not exist', () => {
      const removed = manager.removeVoiceSession('non-existent-id');

      expect(removed).toBe(false);
    });
  });

  describe('getUserVoiceSessions', () => {
    it('should return all sessions for a user', () => {
      const session1 = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const session2 = manager.startVoiceSession('user1', 'session1', 'interaction2');
      manager.startVoiceSession('user2', 'session1', 'interaction3');

      const userSessions = manager.getUserVoiceSessions('user1');
      expect(userSessions).toHaveLength(2);
      expect(userSessions.map(s => s.sessionId)).toContain(session1.sessionId);
      expect(userSessions.map(s => s.sessionId)).toContain(session2.sessionId);
    });

    it('should return empty array for non-existent user', () => {
      const sessions = manager.getUserVoiceSessions('non-existent-user');

      expect(sessions).toEqual([]);
    });

    it('should not include removed sessions', () => {
      const session1 = manager.startVoiceSession('user1', 'session1', 'interaction1');
      manager.startVoiceSession('user1', 'session1', 'interaction2');
      manager.removeVoiceSession(session1.sessionId);

      const userSessions = manager.getUserVoiceSessions('user1');
      expect(userSessions).toHaveLength(1);
    });
  });

  describe('getActiveVoiceSessions', () => {
    it('should return only active sessions', () => {
      const session1 = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const session2 = manager.startVoiceSession('user1', 'session1', 'interaction2');
      manager.startVoiceSession('user1', 'session1', 'interaction3');

      manager.endVoiceSession(session1.sessionId);

      const active = manager.getActiveVoiceSessions();
      expect(active.filter(s => s.isActive)).toHaveLength(2);
    });

    it('should return empty array when no active sessions', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      manager.endVoiceSession(session.sessionId);

      const active = manager.getActiveVoiceSessions();
      expect(active.filter(s => s.isActive)).toHaveLength(0);
    });
  });

  describe('getVoiceSessionStats', () => {
    it('should return session statistics', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      manager.addVoiceChunk(session.sessionId, createVoiceData(1024));
      manager.addVoiceChunk(session.sessionId, createVoiceData(2048));

      const stats = manager.getVoiceSessionStats(session.sessionId);
      expect(stats).toBeDefined();
      expect(stats!.chunkCount).toBe(2);
      expect(stats!.totalBytes).toBe(3072);
      expect(stats!.duration).toBeGreaterThanOrEqual(0);
    });

    it('should return null if session does not exist', () => {
      const stats = manager.getVoiceSessionStats('non-existent-id');

      expect(stats).toBeNull();
    });

    it('should calculate duration correctly', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const startTime = session.startedAt.getTime();

      const delay = 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      manager.addVoiceChunk(session.sessionId, createVoiceData(1024));

      const stats = manager.getVoiceSessionStats(session.sessionId);
      expect(stats!.duration).toBeGreaterThanOrEqual(delay - 10);
    });
  });

  describe('cleanupInactiveSessions', () => {
    it('should remove inactive sessions after timeout', async () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      manager.endVoiceSession(session.sessionId);

      await new Promise(resolve => setTimeout(resolve, 100));

      const removed = manager.cleanupInactiveSessions(50);
      expect(removed).toContain(session.sessionId);
      expect(manager.getVoiceSession(session.sessionId)).toBeNull();
    });

    it('should not remove active sessions', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');

      const removed = manager.cleanupInactiveSessions();
      expect(removed).not.toContain(session.sessionId);
      expect(manager.getVoiceSession(session.sessionId)).not.toBeNull();
    });

    it('should use custom timeout when provided', async () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      manager.endVoiceSession(session.sessionId);

      await new Promise(resolve => setTimeout(resolve, 50));

      const removed = manager.cleanupInactiveSessions(25);
      expect(removed).toContain(session.sessionId);
    });

    it('should return list of removed session IDs', async () => {
      const session1 = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const session2 = manager.startVoiceSession('user1', 'session1', 'interaction2');

      manager.endVoiceSession(session1.sessionId);
      manager.endVoiceSession(session2.sessionId);

      await new Promise(resolve => setTimeout(resolve, 100));

      const removed = manager.cleanupInactiveSessions(50);
      expect(removed).toHaveLength(2);
      expect(removed).toContain(session1.sessionId);
      expect(removed).toContain(session2.sessionId);
    });
  });

  describe('ensureCapacity', () => {
    it('should remove oldest session when max sessions reached', () => {
      const MAX_SESSIONS = 500;

      const sessions: string[] = [];
      for (let i = 0; i < MAX_SESSIONS; i++) {
        const session = manager.startVoiceSession('user' + i, 'session1', 'interaction' + i);
        sessions.push(session.sessionId);
      }

      const oldestSessionId = sessions[0];
      expect(manager.getVoiceSession(oldestSessionId)).not.toBeNull();

      manager.startVoiceSession('user999', 'session1', 'interaction999');

      expect(manager.getVoiceSession(oldestSessionId)).toBeNull();
      expect(manager.getVoiceSessionCount()).toBe(MAX_SESSIONS);
    });

    it('should not remove sessions if under capacity', () => {
      const session1 = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const session2 = manager.startVoiceSession('user2', 'session1', 'interaction2');

      expect(manager.getVoiceSession(session1.sessionId)).not.toBeNull();
      expect(manager.getVoiceSession(session2.sessionId)).not.toBeNull();
    });
  });

  describe('getVoiceSessionCount', () => {
    it('should return number of voice sessions', () => {
      expect(manager.getVoiceSessionCount()).toBe(0);

      manager.startVoiceSession('user1', 'session1', 'interaction1');
      expect(manager.getVoiceSessionCount()).toBe(1);

      manager.startVoiceSession('user1', 'session1', 'interaction2');
      expect(manager.getVoiceSessionCount()).toBe(2);
    });

    it('should decrease count when session is removed', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      expect(manager.getVoiceSessionCount()).toBe(1);

      manager.removeVoiceSession(session.sessionId);
      expect(manager.getVoiceSessionCount()).toBe(0);
    });
  });

  describe('getActiveVoiceSessionCount', () => {
    it('should count only active sessions', () => {
      const session1 = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const session2 = manager.startVoiceSession('user1', 'session1', 'interaction2');
      manager.startVoiceSession('user1', 'session1', 'interaction3');

      manager.endVoiceSession(session1.sessionId);
      manager.removeVoiceSession(session2.sessionId);

      expect(manager.getActiveVoiceSessionCount()).toBe(1);
    });

    it('should return 0 when no active sessions', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      manager.endVoiceSession(session.sessionId);

      expect(manager.getActiveVoiceSessionCount()).toBe(0);
    });
  });

  describe('Memory limits and cleanup', () => {
    it('should prevent unbounded voice session accumulation', () => {
      const MAX_SESSIONS = 500;

      for (let i = 0; i < MAX_SESSIONS; i++) {
        manager.startVoiceSession('user' + i, 'session1', 'interaction' + i);
      }

      expect(manager.getVoiceSessionCount()).toBeLessThanOrEqual(MAX_SESSIONS);

      const extraSession = manager.startVoiceSession('user999', 'session1', 'interaction999');
      expect(extraSession).toBeDefined();
      expect(manager.getVoiceSessionCount()).toBeLessThanOrEqual(MAX_SESSIONS);
    });

    it('should prevent unbounded audio data accumulation', () => {
      const session = manager.startVoiceSession('user1', 'session1', 'interaction1');
      const MAX_BYTES = 50 * 1024 * 1024;

      const maxChunk = createVoiceData(MAX_BYTES);
      manager.addVoiceChunk(session.sessionId, maxChunk);

      expect(() => {
        manager.addVoiceChunk(session.sessionId, createVoiceData(1));
      }).toThrow('Voice session size limit exceeded');
    });

    it('should cleanup enable session reuse after reaching limit', () => {
      const MAX_SESSIONS = 500;

      for (let i = 0; i < MAX_SESSIONS; i++) {
        const session = manager.startVoiceSession('user' + i, 'session1', 'interaction' + i);
        manager.endVoiceSession(session.sessionId);
      }

      manager.cleanupInactiveSessions(0);

      const newSession = manager.startVoiceSession('user999', 'session1', 'interaction999');
      expect(newSession).toBeDefined();
    });
  });
});
