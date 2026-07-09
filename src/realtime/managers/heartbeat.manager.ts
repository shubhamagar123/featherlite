/**
 * Heartbeat Manager
 * Manages connection keep-alive through periodic heartbeats
 */

import { HeartbeatData } from '../types';
import { createLogger } from '@utils/logger';

interface HeartbeatRecord {
  socketId: string;
  userId: string;
  lastHeartbeatAt: Date;
  consecutiveMissed: number;
  latencies: number[];
  isHealthy: boolean;
}

export class HeartbeatManager {
  private logger = createLogger(this.constructor.name);
  private heartbeats = new Map<string, HeartbeatRecord>();
  private maxConsecutiveMissed = 3;
  private latencyWindow = 10; // Keep last 10 latency measurements

  registerHeartbeat(socketId: string, userId: string): HeartbeatRecord {
    const now = new Date();

    const record: HeartbeatRecord = {
      socketId,
      userId,
      lastHeartbeatAt: now,
      consecutiveMissed: 0,
      latencies: [],
      isHealthy: true,
    };

    this.heartbeats.set(socketId, record);

    this.logger.debug(`Heartbeat registered for socket ${socketId}`);
    return record;
  }

  recordHeartbeat(socketId: string, latency: number): HeartbeatData | null {
    const record = this.heartbeats.get(socketId);

    if (!record) {
      return null;
    }

    const now = new Date();

    record.lastHeartbeatAt = now;
    record.consecutiveMissed = 0;
    record.latencies.push(latency);

    if (record.latencies.length > this.latencyWindow) {
      record.latencies.shift();
    }

    record.isHealthy = true;

    this.heartbeats.set(socketId, record);

    return {
      timestamp: now,
      socketId,
      userId: record.userId,
      latency,
      metadata: {
        averageLatency: this.getAverageLatency(socketId),
        maxLatency: this.getMaxLatency(socketId),
        minLatency: this.getMinLatency(socketId),
      },
    };
  }

  recordMissedHeartbeat(socketId: string): HeartbeatRecord | null {
    const record = this.heartbeats.get(socketId);

    if (!record) {
      return null;
    }

    record.consecutiveMissed++;

    if (record.consecutiveMissed >= this.maxConsecutiveMissed) {
      record.isHealthy = false;
      this.logger.warn(
        `Socket ${socketId} marked as unhealthy (${record.consecutiveMissed} missed)`
      );
    }

    this.heartbeats.set(socketId, record);
    return record;
  }

  getHeartbeatRecord(socketId: string): HeartbeatRecord | null {
    return this.heartbeats.get(socketId) || null;
  }

  getHealthyConnections(): string[] {
    const healthy: string[] = [];

    for (const [socketId, record] of this.heartbeats.entries()) {
      if (record.isHealthy) {
        healthy.push(socketId);
      }
    }

    return healthy;
  }

  getUnhealthyConnections(): string[] {
    const unhealthy: string[] = [];

    for (const [socketId, record] of this.heartbeats.entries()) {
      if (!record.isHealthy) {
        unhealthy.push(socketId);
      }
    }

    return unhealthy;
  }

  getAverageLatency(socketId: string): number {
    const record = this.heartbeats.get(socketId);

    if (!record || record.latencies.length === 0) {
      return 0;
    }

    const sum = record.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / record.latencies.length);
  }

  getMaxLatency(socketId: string): number {
    const record = this.heartbeats.get(socketId);

    if (!record || record.latencies.length === 0) {
      return 0;
    }

    return Math.max(...record.latencies);
  }

  getMinLatency(socketId: string): number {
    const record = this.heartbeats.get(socketId);

    if (!record || record.latencies.length === 0) {
      return 0;
    }

    return Math.min(...record.latencies);
  }

  isConnectionHealthy(socketId: string): boolean {
    const record = this.heartbeats.get(socketId);

    if (!record) {
      return false;
    }

    return record.isHealthy;
  }

  resetHeartbeatStatus(socketId: string): HeartbeatRecord | null {
    const record = this.heartbeats.get(socketId);

    if (!record) {
      return null;
    }

    record.consecutiveMissed = 0;
    record.isHealthy = true;
    this.heartbeats.set(socketId, record);

    return record;
  }

  removeHeartbeat(socketId: string): boolean {
    if (this.heartbeats.has(socketId)) {
      this.heartbeats.delete(socketId);
      this.logger.debug(`Heartbeat removed for socket ${socketId}`);
      return true;
    }

    return false;
  }

  getHeartbeatCount(): number {
    return this.heartbeats.size;
  }

  getHealthyConnectionCount(): number {
    return Array.from(this.heartbeats.values()).filter(h => h.isHealthy).length;
  }

  getUnhealthyConnectionCount(): number {
    return Array.from(this.heartbeats.values()).filter(h => !h.isHealthy).length;
  }

  getOverallAverageLatency(): number {
    const records = Array.from(this.heartbeats.values());

    if (records.length === 0) {
      return 0;
    }

    const allLatencies: number[] = [];

    for (const record of records) {
      allLatencies.push(...record.latencies);
    }

    if (allLatencies.length === 0) {
      return 0;
    }

    const sum = allLatencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / allLatencies.length);
  }

  getConnectionsStalerThan(ageMs: number): string[] {
    const now = new Date();
    const stale: string[] = [];

    for (const [socketId, record] of this.heartbeats.entries()) {
      const age = now.getTime() - record.lastHeartbeatAt.getTime();

      if (age > ageMs) {
        stale.push(socketId);
      }
    }

    return stale;
  }
}
