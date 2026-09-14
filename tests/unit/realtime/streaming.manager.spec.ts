import { StreamingManager } from '@/realtime/managers/streaming.manager';
import { StreamingStatus } from '@/realtime/types';

describe('StreamingManager', () => {
  let manager: StreamingManager;

  beforeEach(() => {
    manager = new StreamingManager();
  });

  describe('startStream', () => {
    it('should create a new stream with valid parameters', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');

      expect(stream).toBeDefined();
      expect(stream.userId).toBe('user1');
      expect(stream.sessionId).toBe('session1');
      expect(stream.interactionId).toBe('interaction1');
      expect(stream.companionId).toBe('companion1');
      expect(stream.status).toBe(StreamingStatus.PENDING);
      expect(stream.tokens).toEqual([]);
      expect(stream.totalTokens).toBe(0);
    });

    it('should assign unique streamId to each stream', () => {
      const stream1 = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const stream2 = manager.startStream('user1', 'session1', 'interaction2', 'companion1');

      expect(stream1.streamId).not.toBe(stream2.streamId);
    });

    it('should track streams by interaction ID', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const streams = manager.getInteractionStreams('interaction1');

      expect(streams).toHaveLength(1);
      expect(streams[0].streamId).toBe(stream.streamId);
    });

    it('should reject when exceeding MAX_STREAMS limit', () => {
      const MAX_STREAMS = 1000;

      for (let i = 0; i < MAX_STREAMS; i++) {
        manager.startStream('user1', 'session1', `interaction${i}`, 'companion1');
      }

      expect(() => {
        manager.startStream('user1', 'session1', 'interaction-over', 'companion1');
      }).toThrow('Maximum concurrent streams exceeded');
    });

    it('should clean up expired streams before checking limit', () => {
      const MAX_STREAMS = 1000;

      for (let i = 0; i < MAX_STREAMS; i++) {
        const stream = manager.startStream('user1', 'session1', `interaction${i}`, 'companion1');
        manager.updateStreamStatus(stream.streamId, StreamingStatus.COMPLETED);
      }

      expect(() => {
        manager.startStream('user1', 'session1', 'interaction-after-cleanup', 'companion1');
      }).not.toThrow();
    });

    it('should preserve metadata when provided', () => {
      const metadata = { custom: 'value', nested: { key: 'data' } };
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1', metadata);

      expect(stream.metadata).toEqual(metadata);
    });
  });

  describe('getStream', () => {
    it('should return the stream if it exists', () => {
      const created = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const retrieved = manager.getStream(created.streamId);

      expect(retrieved).toEqual(created);
    });

    it('should return null if stream does not exist', () => {
      const retrieved = manager.getStream('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('addToken', () => {
    it('should add a single token to a stream', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const updated = manager.addToken(stream.streamId, { index: 0, content: 'hello', timestamp: new Date() });

      expect(updated).toBeDefined();
      expect(updated!.tokens).toHaveLength(1);
      expect(updated!.tokens[0].content).toBe('hello');
      expect(updated!.totalTokens).toBe(1);
    });

    it('should increment token index', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.addToken(stream.streamId, { index: 0, content: 'hello', timestamp: new Date() });
      const updated = manager.addToken(stream.streamId, { index: 0, content: 'world', timestamp: new Date() });

      expect(updated!.tokens[0].index).toBe(0);
      expect(updated!.tokens[1].index).toBe(1);
    });

    it('should return null if stream does not exist', () => {
      const updated = manager.addToken('non-existent-id', { index: 0, content: 'hello', timestamp: new Date() });

      expect(updated).toBeNull();
    });

    it('should preserve token timestamp if provided', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const timestamp = new Date('2026-07-10T12:00:00Z');
      const updated = manager.addToken(stream.streamId, { index: 0, content: 'hello', timestamp });

      expect(updated!.tokens[0].timestamp).toEqual(timestamp);
    });

    it('should set token timestamp to current time if not provided', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const before = new Date();
      manager.addToken(stream.streamId, { index: 0, content: 'hello', timestamp: new Date() });
      const after = new Date();

      const token = manager.getStream(stream.streamId)!.tokens[0];
      expect(token.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(token.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('addTokens', () => {
    it('should add multiple tokens to a stream', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const tokens = [
        { index: 0, content: 'hello', timestamp: new Date() },
        { index: 0, content: ' ', timestamp: new Date() },
        { index: 0, content: 'world', timestamp: new Date() },
      ];
      const updated = manager.addTokens(stream.streamId, tokens);

      expect(updated!.tokens).toHaveLength(3);
      expect(updated!.totalTokens).toBe(3);
    });

    it('should reject when exceeding MAX_TOKENS_PER_STREAM', () => {
      const MAX_TOKENS_PER_STREAM = 100000;
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');

      const tokens = Array(MAX_TOKENS_PER_STREAM).fill({ index: 0, content: 'x', timestamp: new Date() });
      manager.addTokens(stream.streamId, tokens);

      expect(() => {
        manager.addTokens(stream.streamId, [{ index: 0, content: 'over-limit', timestamp: new Date() }]);
      }).toThrow('Stream token limit exceeded');
    });

    it('should reject when adding tokens would exceed limit', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');

      const tokens99k = Array(99000).fill({ index: 0, content: 'x', timestamp: new Date() });
      manager.addTokens(stream.streamId, tokens99k);

      const tokens2k = Array(2000).fill({ index: 0, content: 'x', timestamp: new Date() });
      expect(() => {
        manager.addTokens(stream.streamId, tokens2k);
      }).toThrow('Stream token limit exceeded');
    });

    it('should return null if stream does not exist', () => {
      const tokens = [{ index: 0, content: 'hello', timestamp: new Date() }];
      const updated = manager.addTokens('non-existent-id', tokens);

      expect(updated).toBeNull();
    });

    it('should handle empty token array', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const updated = manager.addTokens(stream.streamId, []);

      expect(updated!.tokens).toHaveLength(0);
    });
  });

  describe('updateStreamStatus', () => {
    it('should update stream status', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const updated = manager.updateStreamStatus(stream.streamId, StreamingStatus.STREAMING);

      expect(updated!.status).toBe(StreamingStatus.STREAMING);
    });

    it('should set completedAt when stream ends', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const before = new Date();
      manager.updateStreamStatus(stream.streamId, StreamingStatus.COMPLETED);
      const after = new Date();

      const updated = manager.getStream(stream.streamId)!;
      expect(updated.completedAt).toBeDefined();
      expect(updated.completedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updated.completedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return null if stream does not exist', () => {
      const updated = manager.updateStreamStatus('non-existent-id', StreamingStatus.STREAMING);

      expect(updated).toBeNull();
    });
  });

  describe('cancelStream', () => {
    it('should set stream status to CANCELLED', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const updated = manager.cancelStream(stream.streamId);

      expect(updated!.status).toBe(StreamingStatus.CANCELLED);
    });
  });

  describe('completeStream', () => {
    it('should set stream status to COMPLETED', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const updated = manager.completeStream(stream.streamId);

      expect(updated!.status).toBe(StreamingStatus.COMPLETED);
    });
  });

  describe('errorStream', () => {
    it('should set stream status to ERROR and store error message', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const updated = manager.errorStream(stream.streamId, 'Connection lost');

      expect(updated!.status).toBe(StreamingStatus.ERROR);
      expect(updated!.metadata.error).toBe('Connection lost');
    });
  });

  describe('getStreamContent', () => {
    it('should concatenate all token content', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.addTokens(stream.streamId, [
        { index: 0, content: 'Hello', timestamp: new Date() },
        { index: 0, content: ' ', timestamp: new Date() },
        { index: 0, content: 'World', timestamp: new Date() },
      ]);

      const content = manager.getStreamContent(stream.streamId);
      expect(content).toBe('Hello World');
    });

    it('should return empty string if stream does not exist', () => {
      const content = manager.getStreamContent('non-existent-id');

      expect(content).toBe('');
    });

    it('should return empty string for new stream', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const content = manager.getStreamContent(stream.streamId);

      expect(content).toBe('');
    });
  });

  describe('getStreamTokens', () => {
    it('should return copy of tokens array', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.addToken(stream.streamId, { index: 0, content: 'hello', timestamp: new Date() });

      const tokens = manager.getStreamTokens(stream.streamId);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].content).toBe('hello');
    });

    it('should not expose original tokens array for modification', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.addToken(stream.streamId, { index: 0, content: 'hello', timestamp: new Date() });

      const tokens = manager.getStreamTokens(stream.streamId);
      tokens.pop();

      const tokensAfter = manager.getStreamTokens(stream.streamId);
      expect(tokensAfter).toHaveLength(1);
    });

    it('should return empty array if stream does not exist', () => {
      const tokens = manager.getStreamTokens('non-existent-id');

      expect(tokens).toEqual([]);
    });
  });

  describe('updateMetadata', () => {
    it('should merge metadata', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1', {
        initial: 'value',
      });
      const updated = manager.updateMetadata(stream.streamId, { added: 'field' });

      expect(updated!.metadata).toEqual({ initial: 'value', added: 'field' });
    });

    it('should overwrite existing metadata keys', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1', {
        key: 'old',
      });
      const updated = manager.updateMetadata(stream.streamId, { key: 'new' });

      expect(updated!.metadata.key).toBe('new');
    });

    it('should return null if stream does not exist', () => {
      const updated = manager.updateMetadata('non-existent-id', { key: 'value' });

      expect(updated).toBeNull();
    });
  });

  describe('cleanupExpiredStreams', () => {
    it('should remove expired streams with COMPLETED status', async () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.completeStream(stream.streamId);

      await new Promise(resolve => setTimeout(resolve, 100));

      const expired = manager.cleanupExpiredStreams();
      expect(expired).toContain(stream.streamId);
      expect(manager.getStream(stream.streamId)).toBeNull();
    });

    it('should not remove PENDING streams even if aged', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');

      const expired = manager.cleanupExpiredStreams();
      expect(expired).not.toContain(stream.streamId);
      expect(manager.getStream(stream.streamId)).not.toBeNull();
    });

    it('should not remove STREAMING streams even if aged', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.updateStreamStatus(stream.streamId, StreamingStatus.STREAMING);

      const expired = manager.cleanupExpiredStreams();
      expect(expired).not.toContain(stream.streamId);
      expect(manager.getStream(stream.streamId)).not.toBeNull();
    });

    it('should return list of cleaned up stream IDs', async () => {
      const streams = [
        manager.startStream('user1', 'session1', 'interaction1', 'companion1'),
        manager.startStream('user1', 'session1', 'interaction2', 'companion1'),
        manager.startStream('user1', 'session1', 'interaction3', 'companion1'),
      ];

      streams.forEach(s => manager.completeStream(s.streamId));
      await new Promise(resolve => setTimeout(resolve, 100));

      const expired = manager.cleanupExpiredStreams();
      expect(expired).toHaveLength(streams.length);
      streams.forEach(s => expect(expired).toContain(s.streamId));
    });
  });

  describe('removeStream', () => {
    it('should remove stream by ID', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const removed = manager.removeStream(stream.streamId);

      expect(removed).toBe(true);
      expect(manager.getStream(stream.streamId)).toBeNull();
    });

    it('should remove stream from interaction mapping', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.removeStream(stream.streamId);

      const streams = manager.getInteractionStreams('interaction1');
      expect(streams).toHaveLength(0);
    });

    it('should return false if stream does not exist', () => {
      const removed = manager.removeStream('non-existent-id');

      expect(removed).toBe(false);
    });
  });

  describe('getInteractionStreams', () => {
    it('should return all streams for an interaction', () => {
      const stream1 = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const stream2 = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.startStream('user1', 'session1', 'interaction2', 'companion1');

      const interaction1Streams = manager.getInteractionStreams('interaction1');
      expect(interaction1Streams).toHaveLength(2);
      expect(interaction1Streams.map(s => s.streamId)).toContain(stream1.streamId);
      expect(interaction1Streams.map(s => s.streamId)).toContain(stream2.streamId);
    });

    it('should return empty array for non-existent interaction', () => {
      const streams = manager.getInteractionStreams('non-existent-interaction');

      expect(streams).toEqual([]);
    });

    it('should not include removed streams', () => {
      const stream1 = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.removeStream(stream1.streamId);

      const streams = manager.getInteractionStreams('interaction1');
      expect(streams).toHaveLength(1);
    });
  });

  describe('getActiveStreams', () => {
    it('should return only STREAMING status streams', () => {
      const stream1 = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const stream2 = manager.startStream('user1', 'session1', 'interaction2', 'companion1');
      const stream3 = manager.startStream('user1', 'session1', 'interaction3', 'companion1');

      manager.updateStreamStatus(stream1.streamId, StreamingStatus.STREAMING);
      manager.updateStreamStatus(stream2.streamId, StreamingStatus.STREAMING);
      expect(stream3).toBeDefined();

      const active = manager.getActiveStreams();
      expect(active).toHaveLength(2);
      expect(active.map(s => s.status)).toEqual([StreamingStatus.STREAMING, StreamingStatus.STREAMING]);
    });

    it('should return empty array when no streams are active', () => {
      manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.startStream('user1', 'session1', 'interaction2', 'companion1');

      const active = manager.getActiveStreams();
      expect(active).toEqual([]);
    });
  });

  describe('getStreamCount', () => {
    it('should return number of active streams', () => {
      expect(manager.getStreamCount()).toBe(0);

      manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      expect(manager.getStreamCount()).toBe(1);

      manager.startStream('user1', 'session1', 'interaction2', 'companion1');
      expect(manager.getStreamCount()).toBe(2);
    });

    it('should decrease count when stream is removed', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      expect(manager.getStreamCount()).toBe(1);

      manager.removeStream(stream.streamId);
      expect(manager.getStreamCount()).toBe(0);
    });
  });

  describe('getActiveStreamCount', () => {
    it('should count only STREAMING status streams', () => {
      const stream1 = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const stream2 = manager.startStream('user1', 'session1', 'interaction2', 'companion1');
      manager.startStream('user1', 'session1', 'interaction3', 'companion1');

      manager.updateStreamStatus(stream1.streamId, StreamingStatus.STREAMING);
      manager.updateStreamStatus(stream2.streamId, StreamingStatus.STREAMING);

      expect(manager.getActiveStreamCount()).toBe(2);
    });

    it('should return 0 when no active streams', () => {
      manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      manager.startStream('user1', 'session1', 'interaction2', 'companion1');

      expect(manager.getActiveStreamCount()).toBe(0);
    });
  });

  describe('Memory limits and cleanup', () => {
    it('should prevent unbounded stream accumulation', () => {
      expect(() => {
        for (let i = 0; i < 1001; i++) {
          manager.startStream('user1', 'session1', `interaction${i}`, 'companion1');
        }
      }).toThrow('Maximum concurrent streams exceeded');
    });

    it('should prevent unbounded token accumulation', () => {
      const stream = manager.startStream('user1', 'session1', 'interaction1', 'companion1');
      const tokens = Array(100001).fill({ index: 0, content: 'x' });

      expect(() => {
        manager.addTokens(stream.streamId, tokens);
      }).toThrow('Stream token limit exceeded');
    });

    it('should cleanup enable stream reuse after limit reached', () => {
      const MAX_STREAMS = 1000;

      for (let i = 0; i < MAX_STREAMS; i++) {
        const stream = manager.startStream('user1', 'session1', `interaction${i}`, 'companion1');
        manager.completeStream(stream.streamId);
      }

      manager.cleanupExpiredStreams();

      expect(() => {
        manager.startStream('user1', 'session1', 'interaction-new', 'companion1');
      }).not.toThrow();
    });
  });
});
