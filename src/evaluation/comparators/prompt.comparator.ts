/**
 * Prompt Version Comparator
 * Compares performance across different prompt versions
 */

import {
  EvaluationReport,
  PromptVersionComparison,
  ReportMetrics,
} from '../types';
import { createLogger } from '@utils/logger';

export class PromptComparator {
  private logger = createLogger(this.constructor.name);
  private reports: Map<string, EvaluationReport[]> = new Map();

  async addReport(report: EvaluationReport): Promise<void> {
    try {
      if (!this.reports.has(report.promptVersion)) {
        this.reports.set(report.promptVersion, []);
      }

      this.reports.get(report.promptVersion)!.push(report);
      this.logger.info(`Added report for prompt version ${report.promptVersion}`);
    } catch (error) {
      this.logger.error(`Failed to add report: ${error}`);
      throw error;
    }
  }

  async compareVersions(): Promise<PromptVersionComparison[]> {
    const comparisons: PromptVersionComparison[] = [];
    const versions = Array.from(this.reports.keys()).sort();

    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];
      const reports = this.reports.get(version) || [];

      if (reports.length === 0) {
        continue;
      }

      const latestReport = reports[reports.length - 1];
      const previousReport = i > 0 ? this.getLatestReport(versions[i - 1]) : null;

      const changesSummary = this.generateChangesSummary(version);
      const performanceDelta = previousReport
        ? this.calculatePerformanceDelta(previousReport.metrics, latestReport.metrics)
        : 0;

      comparisons.push({
        version,
        metrics: latestReport.metrics,
        changesSummary,
        performanceDelta,
      });
    }

    return comparisons;
  }

  async compareVersionMetric(metric: string): Promise<{ [key: string]: number }> {
    const comparison: { [key: string]: number } = {};

    this.reports.forEach((reports, version) => {
      if (reports.length === 0) {
        return;
      }

      const latestReport = reports[reports.length - 1];
      const value = this.getMetricValue(latestReport.metrics, metric);
      comparison[version] = value;
    });

    return comparison;
  }

  async rankVersions(): Promise<Array<{ version: string; rank: number; score: number }>> {
    const comparisons = await this.compareVersions();

    return comparisons
      .map((comp, index) => ({
        version: comp.version,
        rank: index + 1,
        score: this.calculateVersionScore(comp.metrics),
      }))
      .sort((a, b) => a.rank - b.rank);
  }

  async findBestVersion(): Promise<string | null> {
    const comparisons = await this.compareVersions();

    if (comparisons.length === 0) {
      return null;
    }

    const best = comparisons.reduce((prev, current) => {
      const prevScore = this.calculateVersionScore(prev.metrics);
      const currScore = this.calculateVersionScore(current.metrics);
      return prevScore > currScore ? prev : current;
    });

    return best.version;
  }

  async getTrendForVersion(
    version: string,
    metric: string
  ): Promise<{ timestamp: Date; value: number }[]> {
    const reports = this.reports.get(version) || [];

    return reports.map(report => ({
      timestamp: report.timestamp,
      value: this.getMetricValue(report.metrics, metric),
    }));
  }

  async compareVersionTrajectories(
    metric: string
  ): Promise<{ [key: string]: { start: number; end: number; improvement: number } }> {
    const trajectories: { [key: string]: { start: number; end: number; improvement: number } } = {};

    this.reports.forEach((reports, version) => {
      if (reports.length < 2) {
        return;
      }

      const startValue = this.getMetricValue(reports[0].metrics, metric);
      const endValue = this.getMetricValue(
        reports[reports.length - 1].metrics,
        metric
      );

      trajectories[version] = {
        start: startValue,
        end: endValue,
        improvement: endValue - startValue,
      };
    });

    return trajectories;
  }

  async getComparisonSummary(): Promise<string> {
    const comparisons = await this.compareVersions();

    if (comparisons.length === 0) {
      return 'No prompt versions have been evaluated yet.';
    }

    let summary = 'Prompt Version Comparison Summary\n';
    summary += '='.repeat(50) + '\n\n';

    comparisons.forEach((comp, index) => {
      const score = this.calculateVersionScore(comp.metrics);
      summary += `${index + 1}. Version ${comp.version}\n`;
      summary += `   Overall Score: ${score}\n`;
      summary += `   Performance Delta: ${comp.performanceDelta > 0 ? '+' : ''}${comp.performanceDelta.toFixed(1)}%\n`;
      summary += `   Memory Recall: ${comp.metrics.memoryRecallRate}%\n`;
      summary += `   Prompt Quality: ${comp.metrics.promptQuality}%\n`;
      summary += `   Changes: ${comp.changesSummary}\n`;
      summary += '\n';
    });

    return summary;
  }

  private generateChangesSummary(version: string): string {
    const versionParts = version.split('.');
    const major = parseInt(versionParts[0], 10);
    const minor = parseInt(versionParts[1], 10);
    const patch = parseInt(versionParts[2], 10);

    if (patch > 0) {
      return 'Bug fixes and optimizations';
    }

    if (minor > 0) {
      return 'New features and improvements';
    }

    if (major > 0) {
      return 'Major architectural changes';
    }

    return 'Initial version';
  }

  private calculateVersionScore(metrics: ReportMetrics): number {
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

  private calculatePerformanceDelta(
    previousMetrics: ReportMetrics,
    currentMetrics: ReportMetrics
  ): number {
    const previousScore = this.calculateVersionScore(previousMetrics);
    const currentScore = this.calculateVersionScore(currentMetrics);

    return currentScore - previousScore;
  }

  private getLatestReport(version: string): EvaluationReport | null {
    const reports = this.reports.get(version);
    if (!reports || reports.length === 0) {
      return null;
    }

    return reports[reports.length - 1];
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
