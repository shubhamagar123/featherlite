/**
 * Trend Analyzer
 * Analyzes metric trends over time and detects regressions/improvements
 */

import {
  MetricTrend,
  TrendPoint,
  ReportMetrics,
  ImprovementItem,
  RegressionItem,
} from '../types';
import { createLogger } from '@utils/logger';

export class TrendAnalyzer {
  private logger = createLogger(this.constructor.name);
  private trends: Map<string, TrendPoint[]> = new Map();

  recordMetrics(timestamp: Date, metrics: ReportMetrics): void {
    try {
      this.addTrendPoint('memoryRecallRate', timestamp, metrics.memoryRecallRate);
      this.addTrendPoint('memoryPrecisionRate', timestamp, metrics.memoryPrecisionRate);
      this.addTrendPoint(
        'relationshipConsistency',
        timestamp,
        metrics.relationshipConsistency
      );
      this.addTrendPoint('promptQuality', timestamp, metrics.promptQuality);
      this.addTrendPoint('contextQuality', timestamp, metrics.contextQuality);
      this.addTrendPoint('hallucinationRate', timestamp, metrics.hallucinationRate);
      this.addTrendPoint('empathyScore', timestamp, metrics.empathyScore);
      this.addTrendPoint('humourScore', timestamp, metrics.humourScore);
      this.addTrendPoint('personalityConsistency', timestamp, metrics.personalityConsistency);
      this.addTrendPoint('conversationContinuity', timestamp, metrics.conversationContinuity);

      this.logger.info('Recorded metrics trend point');
    } catch (error) {
      this.logger.error(`Failed to record metrics: ${error}`);
    }
  }

  getTrends(): MetricTrend[] {
    const trends: MetricTrend[] = [];

    this.trends.forEach((values, metricName) => {
      trends.push({
        metricName,
        values: [...values],
      });
    });

    return trends;
  }

  getTrendForMetric(metricName: string): TrendPoint[] {
    return this.trends.get(metricName) || [];
  }

  detectRegressions(threshold: number = 5): RegressionItem[] {
    const regressions: RegressionItem[] = [];

    this.trends.forEach((points, _metricName) => {
      if (points.length < 2) {
        return;
      }

      for (let i = 1; i < points.length; i++) {
        const previous = points[i - 1].value;
        const current = points[i].value;
        const difference = previous - current;

        if (difference > threshold) {
          regressions.push({
            scenarioId: `metric-${i}`,
            scenarioType: 'PROMPT_QUALITY' as any,
            previousScore: previous,
            currentScore: current,
            difference,
            severity: this.getSeverity(difference),
          });
        }
      }
    });

    return regressions.sort((a, b) => b.difference - a.difference);
  }

  detectImprovements(threshold: number = 5): ImprovementItem[] {
    const improvements: ImprovementItem[] = [];

    this.trends.forEach((points, _metricName) => {
      if (points.length < 2) {
        return;
      }

      for (let i = 1; i < points.length; i++) {
        const previous = points[i - 1].value;
        const current = points[i].value;
        const difference = current - previous;

        if (difference > threshold) {
          improvements.push({
            scenarioId: `metric-${i}`,
            scenarioType: 'PROMPT_QUALITY' as any,
            previousScore: previous,
            currentScore: current,
            difference,
            magnitude: this.getMagnitude(difference),
          });
        }
      }
    });

    return improvements.sort((a, b) => b.difference - a.difference);
  }

  getMetricDirection(
    metricName: string
  ): 'up' | 'down' | 'stable' {
    const points = this.trends.get(metricName);

    if (!points || points.length < 2) {
      return 'stable';
    }

    const recent = points.slice(-5);
    const oldest = recent[0].value;
    const newest = recent[recent.length - 1].value;

    const changePercent = ((newest - oldest) / oldest) * 100;

    if (changePercent > 2) {
      return 'up';
    }

    if (changePercent < -2) {
      return 'down';
    }

    return 'stable';
  }

  compareMetrics(
    previous: ReportMetrics,
    current: ReportMetrics
  ): { improvements: string[]; regressions: string[] } {
    const improvements: string[] = [];
    const regressions: string[] = [];
    const threshold = 5;

    const metrics = [
      'memoryRecallRate',
      'memoryPrecisionRate',
      'relationshipConsistency',
      'promptQuality',
      'contextQuality',
      'empathyScore',
      'humourScore',
      'personalityConsistency',
      'conversationContinuity',
    ];

    metrics.forEach(metric => {
      const prevValue = previous[metric as keyof ReportMetrics] as number;
      const currValue = current[metric as keyof ReportMetrics] as number;
      const diff = currValue - prevValue;

      if (diff > threshold) {
        improvements.push(`${metric}: +${diff.toFixed(1)}`);
      } else if (diff < -threshold) {
        regressions.push(`${metric}: ${diff.toFixed(1)}`);
      }
    });

    return { improvements, regressions };
  }

  private addTrendPoint(metricName: string, timestamp: Date, value: number): void {
    if (!this.trends.has(metricName)) {
      this.trends.set(metricName, []);
    }

    const points = this.trends.get(metricName)!;
    points.push({ timestamp, value });

    if (points.length > 1000) {
      points.shift();
    }
  }

  private getSeverity(difference: number): 'low' | 'medium' | 'high' | 'critical' {
    if (difference > 20) {
      return 'critical';
    }

    if (difference > 15) {
      return 'high';
    }

    if (difference > 10) {
      return 'medium';
    }

    return 'low';
  }

  private getMagnitude(difference: number): 'small' | 'medium' | 'large' {
    if (difference > 15) {
      return 'large';
    }

    if (difference > 10) {
      return 'medium';
    }

    return 'small';
  }

  clearTrends(): void {
    this.trends.clear();
    this.logger.info('Cleared all trends');
  }
}
