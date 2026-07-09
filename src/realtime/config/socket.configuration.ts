/**
 * Socket Configuration
 * Manages Socket.IO configuration and defaults
 */

import { SocketConfiguration } from '../types';
import { createLogger } from '@utils/logger';

export class SocketConfigurationManager {
  private logger = createLogger(this.constructor.name);
  private config: SocketConfiguration;

  constructor(customConfig?: Partial<SocketConfiguration>) {
    this.config = {
      port: customConfig?.port || 3001,
      namespace: customConfig?.namespace || '/realtime',
      enableCompression: customConfig?.enableCompression ?? true,
      heartbeatInterval: customConfig?.heartbeatInterval || 30000,
      heartbeatTimeout: customConfig?.heartbeatTimeout || 90000,
      reconnectDelay: customConfig?.reconnectDelay || 1000,
      maxReconnectAttempts: customConfig?.maxReconnectAttempts || 5,
      maxConcurrentStreams: customConfig?.maxConcurrentStreams || 10,
      eventBufferSize: customConfig?.eventBufferSize || 100,
      rateLimitWindow: customConfig?.rateLimitWindow || 60000,
      rateLimitMaxEvents: customConfig?.rateLimitMaxEvents || 100,
    };

    this.logger.info('Socket configuration initialized');
    this.logConfiguration();
  }

  getConfiguration(): SocketConfiguration {
    return { ...this.config };
  }

  getPort(): number {
    return this.config.port;
  }

  getNamespace(): string {
    return this.config.namespace;
  }

  isCompressionEnabled(): boolean {
    return this.config.enableCompression;
  }

  getHeartbeatInterval(): number {
    return this.config.heartbeatInterval;
  }

  getHeartbeatTimeout(): number {
    return this.config.heartbeatTimeout;
  }

  getReconnectDelay(): number {
    return this.config.reconnectDelay;
  }

  getMaxReconnectAttempts(): number {
    return this.config.maxReconnectAttempts;
  }

  getMaxConcurrentStreams(): number {
    return this.config.maxConcurrentStreams;
  }

  getEventBufferSize(): number {
    return this.config.eventBufferSize;
  }

  getRateLimitWindow(): number {
    return this.config.rateLimitWindow;
  }

  getRateLimitMaxEvents(): number {
    return this.config.rateLimitMaxEvents;
  }

  updateConfiguration(updates: Partial<SocketConfiguration>): void {
    this.config = {
      ...this.config,
      ...updates,
    };

    this.logger.info('Socket configuration updated');
    this.logConfiguration();
  }

  setPort(port: number): void {
    if (port < 1 || port > 65535) {
      throw new Error('Invalid port number');
    }
    this.config.port = port;
  }

  setNamespace(namespace: string): void {
    if (!namespace.startsWith('/')) {
      throw new Error('Namespace must start with /');
    }
    this.config.namespace = namespace;
  }

  setHeartbeatInterval(interval: number): void {
    if (interval < 1000) {
      throw new Error('Heartbeat interval must be at least 1 second');
    }
    this.config.heartbeatInterval = interval;
  }

  setHeartbeatTimeout(timeout: number): void {
    if (timeout < this.config.heartbeatInterval) {
      throw new Error('Heartbeat timeout must be greater than interval');
    }
    this.config.heartbeatTimeout = timeout;
  }

  setReconnectDelay(delay: number): void {
    if (delay < 100) {
      throw new Error('Reconnect delay must be at least 100ms');
    }
    this.config.reconnectDelay = delay;
  }

  setMaxReconnectAttempts(attempts: number): void {
    if (attempts < 1) {
      throw new Error('Max reconnect attempts must be at least 1');
    }
    this.config.maxReconnectAttempts = attempts;
  }

  setMaxConcurrentStreams(streams: number): void {
    if (streams < 1) {
      throw new Error('Max concurrent streams must be at least 1');
    }
    this.config.maxConcurrentStreams = streams;
  }

  setEventBufferSize(size: number): void {
    if (size < 10) {
      throw new Error('Event buffer size must be at least 10');
    }
    this.config.eventBufferSize = size;
  }

  setRateLimitWindow(window: number): void {
    if (window < 1000) {
      throw new Error('Rate limit window must be at least 1 second');
    }
    this.config.rateLimitWindow = window;
  }

  setRateLimitMaxEvents(max: number): void {
    if (max < 1) {
      throw new Error('Rate limit max events must be at least 1');
    }
    this.config.rateLimitMaxEvents = max;
  }

  validateConfiguration(): boolean {
    if (this.config.port < 1 || this.config.port > 65535) {
      this.logger.error('Invalid port number');
      return false;
    }

    if (!this.config.namespace.startsWith('/')) {
      this.logger.error('Namespace must start with /');
      return false;
    }

    if (this.config.heartbeatInterval < 1000) {
      this.logger.error('Heartbeat interval must be at least 1 second');
      return false;
    }

    if (this.config.heartbeatTimeout < this.config.heartbeatInterval) {
      this.logger.error('Heartbeat timeout must be greater than interval');
      return false;
    }

    if (this.config.maxReconnectAttempts < 1) {
      this.logger.error('Max reconnect attempts must be at least 1');
      return false;
    }

    return true;
  }

  private logConfiguration(): void {
    this.logger.debug(`Socket Configuration:
      Port: ${this.config.port}
      Namespace: ${this.config.namespace}
      Compression: ${this.config.enableCompression}
      Heartbeat Interval: ${this.config.heartbeatInterval}ms
      Heartbeat Timeout: ${this.config.heartbeatTimeout}ms
      Max Concurrent Streams: ${this.config.maxConcurrentStreams}
      Rate Limit: ${this.config.rateLimitMaxEvents} events per ${this.config.rateLimitWindow}ms
    `);
  }

  toJSON(): SocketConfiguration {
    return this.getConfiguration();
  }
}
