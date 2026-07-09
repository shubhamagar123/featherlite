/**
 * Model Comparator
 * Compares performance across different LLM providers
 */

import {
  EvaluationReport,
  ModelComparisonData,
  ModelProvider,
  ReportMetrics,
} from '../types';
import { createLogger } from '@utils/logger';

export class ModelComparator {
  private logger = createLogger(this.constructor.name);
  private reports: Map<ModelProvider, EvaluationReport[]> = new Map();

  async addReport(report: EvaluationReport): Promise<void> {
    try {
      if (!this.reports.has(report.modelProvider)) {
        this.reports.set(report.modelProvider, []);
      }

      this.reports.get(report.modelProvider)!.push(report);
      this.logger.info(`Added report for model ${report.modelProvider}`);
    } catch (error) {
      this.logger.error(`Failed to add report: ${error}`);
      throw error;
    }
  }

  async compareModels(): Promise<ModelComparisonData[]> {
    const comparisons: ModelComparisonData[] = [];

    this.reports.forEach((reports, modelProvider) => {
      if (reports.length === 0) {
        return;
      }

      const latestReport = reports[reports.length - 1];
      const metrics = latestReport.metrics;

      const cost = metrics.estimatedCost;
      const latency = metrics.averageLatency;
      const quality = this.calculateQualityScore(metrics);

      comparisons.push({
        model: modelProvider,
        metrics,
        cost,
        latency,
        quality,
      });
    });

    return comparisons.sort((a, b) => b.quality - a.quality);
  }

  async compareModelMetric(metric: string): Promise<{ [key in ModelProvider]?: number }> {
    const comparison: any = {};

    this.reports.forEach((reports, modelProvider) => {
      if (reports.length === 0) {
        return;
      }

      const latestReport = reports[reports.length - 1];
      const value = this.getMetricValue(latestReport.metrics, metric);
      comparison[modelProvider] = value;
    });

    return comparison;
  }

  async rankModels(): Promise<Array<{ model: ModelProvider; rank: number; score: number }>> {
    const comparisons = await this.compareModels();

    return comparisons.map((comp, index) => ({
      model: comp.model,
      rank: index + 1,
      score: comp.quality,
    }));
  }

  async findBestModel(
    criteria: 'quality' | 'cost' | 'latency' = 'quality'
  ): Promise<ModelProvider | null> {
    const comparisons = await this.compareModels();

    if (comparisons.length === 0) {
      return null;
    }

    let best = comparisons[0];

    if (criteria === 'cost') {
      best = comparisons.reduce((prev, current) =>
        prev.cost < current.cost ? prev : current
      );
    } else if (criteria === 'latency') {
      best = comparisons.reduce((prev, current) =>
        prev.latency < current.latency ? prev : current
      );
    } else {
      best = comparisons.reduce((prev, current) =>
        prev.quality > current.quality ? prev : current
      );
    }

    return best.model;
  }

  async getTrendForModel(
    modelProvider: ModelProvider,
    metric: string
  ): Promise<{ timestamp: Date; value: number }[]> {
    const reports = this.reports.get(modelProvider) || [];

    return reports.map(report => ({
      timestamp: report.timestamp,
      value: this.getMetricValue(report.metrics, metric),
    }));
  }

  async compareTrajectories(
    metric: string
  ): Promise<{ [key in ModelProvider]?: { start: number; end: number; trend: 'up' | 'down' | 'stable' } }> {
    const trajectories: any = {};

    this.reports.forEach((reports, modelProvider) => {
      if (reports.length < 2) {
        return;
      }

      const startValue = this.getMetricValue(reports[0].metrics, metric);
      const endValue = this.getMetricValue(
        reports[reports.length - 1].metrics,
        metric
      );

      let trend: 'up' | 'down' | 'stable' = 'stable';
      const change = endValue - startValue;

      if (change > 2) {
        trend = 'up';
      } else if (change < -2) {
        trend = 'down';
      }

      trajectories[modelProvider] = {
        start: startValue,
        end: endValue,
        trend,
      };
    });

    return trajectories;
  }

  async getComparisonSummary(): Promise<string> {
    const comparisons = await this.compareModels();

    if (comparisons.length === 0) {
      return 'No models have been evaluated yet.';
    }

    let summary = 'Model Comparison Summary\n';
    summary += '='.repeat(50) + '\n\n';

    comparisons.forEach((comp, index) => {
      summary += `${index + 1}. ${comp.model}\n`;
      summary += `   Quality Score: ${comp.quality.toFixed(1)}\n`;
      summary += `   Average Latency: ${comp.latency}ms\n`;
      summary += `   Estimated Cost: $${comp.cost.toFixed(4)}\n`;
      summary += `   Memory Recall: ${comp.metrics.memoryRecallRate}%\n`;
      summary += `   Context Quality: ${comp.metrics.contextQuality}%\n`;
      summary += '\n';
    });

    return summary;
  }

  private calculateQualityScore(metrics: ReportMetrics): number {
    const weights = {
      memoryRecallRate: 0.15,
      memoryPrecisionRate: 0.15,
      relationshipConsistency: 0.1,
      promptQuality: 0.15,
      contextQuality: 0.1,
      empathyScore: 0.1,
      personalityConsistency: 0.1,
      conversationContinuity: 0.15,
    };

    let score = 0;

    Object.entries(weights).forEach(([metric, weight]) => {
      const value = metrics[metric as keyof ReportMetrics] as number;
      score += value * weight;
    });

    return Math.round(score);
  }

  private getMetricValue(metrics: ReportMetrics, metric: string): number {
    const lowerMetric = metric.toLowerCase().replace(/\s+/g, '_');

    switch (lowerMetric) {
      case 'memory_recall_rate':
        return metrics.memoryRecallRate;
      case 'memory_precision_rate':
        return metrics.memoryPrecisionRate;
      case 'relationship_consistency':
        return metrics.relationshipConsistency;
      case 'prompt_quality':
        return metrics.promptQuality;
      case 'context_quality':
        return metrics.contextQuality;
      case 'empathy_score':
        return metrics.empathyScore;
      case 'humour_score':
        return metrics.humourScore;
      case 'personality_consistency':
        return metrics.personalityConsistency;
      case 'conversation_continuity':
        return metrics.conversationContinuity;
      case 'hallucination_rate':
        return metrics.hallucinationRate;
      default:
        return 0;
    }
  }

  clearReports(): void {
    this.reports.clear();
    this.logger.info('Cleared all reports');
  }
}
