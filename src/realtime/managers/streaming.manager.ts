/**
 * Streaming Manager
 * Manages LLM response streaming pipeline
 */

import { StreamingContext, StreamingStatus, StreamToken } from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class StreamingManager {
  private logger = createLogger(this.constructor.name);
  private streams = new Map<string, StreamingContext>();
  private interactionStreams = new Map<string, Set<string>>();
  private static readonly MAX_TOKENS_PER_STREAM = 100000;
  private static readonly MAX_STREAMS = 1000;
  private static readonly STREAM_TIMEOUT_MS = 300000;

  startStream(
    userId: string,
    sessionId: string,
    interactionId: string,
    companionId: string,
    metadata?: Record<string, any>
  ): StreamingContext {
    this.cleanupExpiredStreams();

    if (this.streams.size >= StreamingManager.MAX_STREAMS) {
      throw new Error('Maximum concurrent streams exceeded');
    }

    const streamId = uuidv4();

    const stream: StreamingContext = {
      streamId,
      userId,
      sessionId,
      interactionId,
      companionId,
      status: StreamingStatus.PENDING,
      startedAt: new Date(),
      tokens: [],
      totalTokens: 0,
      metadata: metadata || {},
    };

    this.streams.set(streamId, stream);

    if (!this.interactionStreams.has(interactionId)) {
      this.interactionStreams.set(interactionId, new Set());
    }
    this.interactionStreams.get(interactionId)!.add(streamId);

    this.logger.debug(`Stream started: ${streamId} for interaction ${interactionId}`);

    return stream;
  }

  getStream(streamId: string): StreamingContext | null {
    return this.streams.get(streamId) || null;
  }

  getInteractionStreams(interactionId: string): StreamingContext[] {
    const streamIds = this.interactionStreams.get(interactionId) || new Set();
    const streams: StreamingContext[] = [];

    for (const streamId of streamIds) {
      const stream = this.streams.get(streamId);
      if (stream) {
        streams.push(stream);
      }
    }

    return streams;
  }

  getActiveStreams(): StreamingContext[] {
    return Array.from(this.streams.values()).filter(
      s => s.status === StreamingStatus.STREAMING
    );
  }

  updateStreamStatus(streamId: string, status: StreamingStatus): StreamingContext | null {
    const stream = this.streams.get(streamId);

    if (!stream) {
      return null;
    }

    const previousStatus = stream.status;
    stream.status = status;

    if (status === StreamingStatus.STREAMING && previousStatus === StreamingStatus.PENDING) {
      // Starting streaming
    } else if (
      status === StreamingStatus.COMPLETED ||
      status === StreamingStatus.CANCELLED ||
      status === StreamingStatus.ERROR
    ) {
      // Ending streaming
      stream.completedAt = new Date();
    }

    this.streams.set(streamId, stream);

    this.logger.debug(`Stream status updated: ${streamId} -> ${status}`);
    return stream;
  }

  addToken(streamId: string, token: Omit<StreamToken, 'id'>): StreamingContext | null {
    const stream = this.streams.get(streamId);

    if (!stream) {
      return null;
    }

    const tokenId = uuidv4();
    const newToken: StreamToken = {
      id: tokenId,
      index: stream.tokens.length,
      content: token.content,
      timestamp: token.timestamp || new Date(),
      metadata: token.metadata,
    };

    stream.tokens.push(newToken);
    stream.totalTokens = stream.tokens.length;

    this.streams.set(streamId, stream);
    return stream;
  }

  addTokens(
    streamId: string,
    tokens: Array<Omit<StreamToken, 'id'>>
  ): StreamingContext | null {
    const stream = this.streams.get(streamId);

    if (!stream) {
      return null;
    }

    if (stream.tokens.length + tokens.length > StreamingManager.MAX_TOKENS_PER_STREAM) {
      throw new Error(`Stream token limit exceeded: ${StreamingManager.MAX_TOKENS_PER_STREAM}`);
    }

    for (let i = 0; i < tokens.length; i++) {
      const tokenId = uuidv4();
      const newToken: StreamToken = {
        id: tokenId,
        index: stream.tokens.length + i,
        content: tokens[i].content,
        timestamp: tokens[i].timestamp || new Date(),
        metadata: tokens[i].metadata,
      };
      stream.tokens.push(newToken);
    }

    stream.totalTokens = stream.tokens.length;
    this.streams.set(streamId, stream);

    return stream;
  }

  getStreamContent(streamId: string): string {
    const stream = this.streams.get(streamId);

    if (!stream) {
      return '';
    }

    return stream.tokens.map(t => t.content).join('');
  }

  getStreamTokens(streamId: string): StreamToken[] {
    const stream = this.streams.get(streamId);

    if (!stream) {
      return [];
    }

    return [...stream.tokens];
  }

  updateMetadata(streamId: string, metadata: Record<string, any>): StreamingContext | null {
    const stream = this.streams.get(streamId);

    if (!stream) {
      return null;
    }

    stream.metadata = { ...stream.metadata, ...metadata };
    this.streams.set(streamId, stream);

    return stream;
  }

  cancelStream(streamId: string): StreamingContext | null {
    return this.updateStreamStatus(streamId, StreamingStatus.CANCELLED);
  }

  completeStream(streamId: string): StreamingContext | null {
    return this.updateStreamStatus(streamId, StreamingStatus.COMPLETED);
  }

  errorStream(streamId: string, error: string): StreamingContext | null {
    const stream = this.updateStreamStatus(streamId, StreamingStatus.ERROR);

    if (stream) {
      stream.metadata.error = error;
    }

    return stream;
  }

  cleanupExpiredStreams(): string[] {
    const now = new Date();
    const expired: string[] = [];

    for (const [streamId, stream] of this.streams.entries()) {
      const age = now.getTime() - stream.startedAt.getTime();

      if (
        age > StreamingManager.STREAM_TIMEOUT_MS &&
        (stream.status === StreamingStatus.COMPLETED ||
          stream.status === StreamingStatus.ERROR ||
          stream.status === StreamingStatus.CANCELLED)
      ) {
        this.removeStream(streamId);
        expired.push(streamId);
      }
    }

    return expired;
  }

  removeStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);

    if (!stream) {
      return false;
    }

    this.streams.delete(streamId);

    const interactionStreams = this.interactionStreams.get(stream.interactionId);
    if (interactionStreams) {
      interactionStreams.delete(streamId);
    }

    this.logger.debug(`Stream removed: ${streamId}`);
    return true;
  }

  getStreamCount(): number {
    return this.streams.size;
  }

  getActiveStreamCount(): number {
    return Array.from(this.streams.values()).filter(
      s => s.status === StreamingStatus.STREAMING
    ).length;
  }
}
