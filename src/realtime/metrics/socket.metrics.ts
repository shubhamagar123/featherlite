/**
 * Socket Metrics
 * Tracks performance and event metrics
 */

import { SocketMetrics, TopicMetrics } from '../types';
import { createLogger } from '@utils/logger';

interface EventMetric {
  count: number;
  totalLatency: number;
  errorCount: number;
  lastOccurrence: Date;
}

export class SocketMetricsCollector {
  private logger = createLogger(this.constructor.name);
  private connectedSockets = 0;
  private activeInteractions = 0;
  private messagesSent = 0;
  private messagesReceived = 0;
  private totalLatency = 0;
  private latencyCount = 0;
  private errorCount = 0;
  private lastUpdated = new Date();
  private topicMetrics = new Map<string, EventMetric>();

  recordConnection(): void {
    this.connectedSockets++;
    this.lastUpdated = new Date();
  }

  recordDisconnection(): void {
    if (this.connectedSockets > 0) {
      this.connectedSockets--;
    }
    this.lastUpdated = new Date();
  }

  recordInteractionStart(): void {
    this.activeInteractions++;
    this.lastUpdated = new Date();
  }

  recordInteractionEnd(): void {
    if (this.activeInteractions > 0) {
      this.activeInteractions--;
    }
    this.lastUpdated = new Date();
  }

  recordMessageSent(eventType: string, latency: number): void {
    this.messagesSent++;
    this.recordEventMetric(eventType, latency, false);
    this.lastUpdated = new Date();
  }

  recordMessageReceived(eventType: string, latency: number): void {
    this.messagesReceived++;
    this.recordEventMetric(eventType, latency, false);
    this.lastUpdated = new Date();
  }

  recordError(eventType: string): void {
    this.errorCount++;
    this.recordEventMetric(eventType, 0, true);
    this.lastUpdated = new Date();
  }

  private recordEventMetric(
    eventType: string,
    latency: number,
    isError: boolean
  ): void {
    let metric = this.topicMetrics.get(eventType);

    if (!metric) {
      metric = {
        count: 0,
        totalLatency: 0,
        errorCount: 0,
        lastOccurrence: new Date(),
      };
    }

    metric.count++;
    metric.totalLatency += latency;
    if (isError) {
      metric.errorCount++;
    }
    metric.lastOccurrence = new Date();

    this.topicMetrics.set(eventType, metric);

    if (!isError && latency > 0) {
      this.totalLatency += latency;
      this.latencyCount++;
    }
  }

  getMetrics(): SocketMetrics {
    const topicMetricsMap = new Map<string, TopicMetrics>();

    for (const [eventType, metric] of this.topicMetrics.entries()) {
      const averageLatency =
        metric.count > 0 ? Math.round(metric.totalLatency / metric.count) : 0;

      topicMetricsMap.set(eventType, {
        eventType,
        count: metric.count,
        averageLatency,
        errorCount: metric.errorCount,
        lastOccurrence: metric.lastOccurrence,
      });
    }

    return {
      connectedSockets: this.connectedSockets,
      activeInteractions: this.activeInteractions,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      averageLatency:
        this.latencyCount > 0 ? Math.round(this.totalLatency / this.latencyCount) : 0,
      errorCount: this.errorCount,
      lastUpdated: this.lastUpdated,
      topicMetrics: topicMetricsMap,
    };
  }

  getEventMetrics(eventType: string): TopicMetrics | null {
    const metric = this.topicMetrics.get(eventType);

    if (!metric) {
      return null;
    }

    const averageLatency =
      metric.count > 0 ? Math.round(metric.totalLatency / metric.count) : 0;

    return {
      eventType,
      count: metric.count,
      averageLatency,
      errorCount: metric.errorCount,
      lastOccurrence: metric.lastOccurrence,
    };
  }

  getAllEventMetrics(): TopicMetrics[] {
    const all: TopicMetrics[] = [];

    for (const [eventType, metric] of this.topicMetrics.entries()) {
      const averageLatency =
        metric.count > 0 ? Math.round(metric.totalLatency / metric.count) : 0;

      all.push({
        eventType,
        count: metric.count,
        averageLatency,
        errorCount: metric.errorCount,
        lastOccurrence: metric.lastOccurrence,
      });
    }

    return all;
  }

  resetMetrics(): void {
    this.connectedSockets = 0;
    this.activeInteractions = 0;
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.totalLatency = 0;
    this.latencyCount = 0;
    this.errorCount = 0;
    this.lastUpdated = new Date();
    this.topicMetrics.clear();

    this.logger.debug('Metrics reset');
  }

  getConnectionCount(): number {
    return this.connectedSockets;
  }

  getInteractionCount(): number {
    return this.activeInteractions;
  }

  getMessageCount(): number {
    return this.messagesSent + this.messagesReceived;
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  getAverageLatency(): number {
    return this.latencyCount > 0
      ? Math.round(this.totalLatency / this.latencyCount)
      : 0;
  }

  getTopicCount(): number {
    return this.topicMetrics.size;
  }

  getMostActiveTopic(): string | null {
    let maxCount = 0;
    let mostActive: string | null = null;

    for (const [eventType, metric] of this.topicMetrics.entries()) {
      if (metric.count > maxCount) {
        maxCount = metric.count;
        mostActive = eventType;
      }
    }

    return mostActive;
  }

  getHighestErrorTopic(): string | null {
    let maxErrors = 0;
    let highestError: string | null = null;

    for (const [eventType, metric] of this.topicMetrics.entries()) {
      if (metric.errorCount > maxErrors) {
        maxErrors = metric.errorCount;
        highestError = eventType;
      }
    }

    return highestError;
  }

  getSlowestTopic(): string | null {
    let maxLatency = 0;
    let slowest: string | null = null;

    for (const [eventType, metric] of this.topicMetrics.entries()) {
      const avgLatency = metric.count > 0 ? metric.totalLatency / metric.count : 0;
      if (avgLatency > maxLatency) {
        maxLatency = avgLatency;
        slowest = eventType;
      }
    }

    return slowest;
  }
}
