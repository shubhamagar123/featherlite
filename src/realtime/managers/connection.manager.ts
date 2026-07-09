/**
 * Connection Manager
 * Manages socket connections lifecycle
 */

import { SocketConnection } from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ConnectionManager {
  private logger = createLogger(this.constructor.name);
  private connections = new Map<string, SocketConnection>();
  private userConnections = new Map<string, Set<string>>();
  private sessionConnections = new Map<string, Set<string>>();

  registerConnection(
    socketId: string,
    userId: string,
    sessionId: string,
    deviceId: string,
    userAgent: string,
    ipAddress: string,
    metadata?: Record<string, any>
  ): SocketConnection {
    const connection: SocketConnection = {
      socketId,
      userId,
      sessionId,
      deviceId,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      isAuthenticated: false,
      correlationId: uuidv4(),
      userAgent,
      ipAddress,
      metadata: metadata || {},
    };

    this.connections.set(socketId, connection);

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socketId);

    if (!this.sessionConnections.has(sessionId)) {
      this.sessionConnections.set(sessionId, new Set());
    }
    this.sessionConnections.get(sessionId)!.add(socketId);

    this.logger.info(`Connection registered: ${socketId} for user ${userId}`);
    return connection;
  }

  getConnection(socketId: string): SocketConnection | null {
    return this.connections.get(socketId) || null;
  }

  getUserConnections(userId: string): SocketConnection[] {
    const socketIds = this.userConnections.get(userId) || new Set();
    const connections: SocketConnection[] = [];

    for (const socketId of socketIds) {
      const conn = this.connections.get(socketId);
      if (conn) {
        connections.push(conn);
      }
    }

    return connections;
  }

  getSessionConnections(sessionId: string): SocketConnection[] {
    const socketIds = this.sessionConnections.get(sessionId) || new Set();
    const connections: SocketConnection[] = [];

    for (const socketId of socketIds) {
      const conn = this.connections.get(socketId);
      if (conn) {
        connections.push(conn);
      }
    }

    return connections;
  }

  authenticateConnection(socketId: string): boolean {
    const connection = this.connections.get(socketId);

    if (!connection) {
      return false;
    }

    connection.isAuthenticated = true;
    this.connections.set(socketId, connection);

    this.logger.debug(`Connection authenticated: ${socketId}`);
    return true;
  }

  updateHeartbeat(socketId: string): boolean {
    const connection = this.connections.get(socketId);

    if (!connection) {
      return false;
    }

    connection.lastHeartbeat = new Date();
    this.connections.set(socketId, connection);

    return true;
  }

  updateMetadata(socketId: string, metadata: Record<string, any>): boolean {
    const connection = this.connections.get(socketId);

    if (!connection) {
      return false;
    }

    connection.metadata = { ...connection.metadata, ...metadata };
    this.connections.set(socketId, connection);

    return true;
  }

  removeConnection(socketId: string): boolean {
    const connection = this.connections.get(socketId);

    if (!connection) {
      return false;
    }

    this.connections.delete(socketId);

    const userSockets = this.userConnections.get(connection.userId);
    if (userSockets) {
      userSockets.delete(socketId);
    }

    const sessionSockets = this.sessionConnections.get(connection.sessionId);
    if (sessionSockets) {
      sessionSockets.delete(socketId);
    }

    this.logger.info(`Connection removed: ${socketId}`);
    return true;
  }

  removeUserConnections(userId: string): number {
    const socketIds = this.userConnections.get(userId) || new Set();
    let removedCount = 0;

    for (const socketId of socketIds) {
      this.connections.delete(socketId);
      removedCount++;
    }

    this.userConnections.delete(userId);
    return removedCount;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getUserConnectionCount(userId: string): number {
    return (this.userConnections.get(userId) || new Set()).size;
  }

  getAllConnections(): SocketConnection[] {
    return Array.from(this.connections.values());
  }

  getStaleConnections(timeoutMs: number): SocketConnection[] {
    const now = new Date();
    const stale: SocketConnection[] = [];

    for (const connection of this.connections.values()) {
      const timeSinceHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();

      if (timeSinceHeartbeat > timeoutMs) {
        stale.push(connection);
      }
    }

    return stale;
  }
}
