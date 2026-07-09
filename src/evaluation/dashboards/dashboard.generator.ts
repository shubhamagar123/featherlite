/**
 * Dashboard Generator
 * Generates evaluation dashboard data with trends and comparisons
 */

import {
  DashboardData,
  EvaluationReport,
  MetricTrend,
  ReportMetrics,
  ModelComparisonData,
  PromptVersionComparison,
} from '../types';
import { createLogger } from '@utils/logger';
import { TrendAnalyzer } from '../metrics/trend.analyzer';

export class DashboardGenerator {
  private logger = createLogger(this.constructor.name);
  private trendAnalyzer: TrendAnalyzer;
  private reports: EvaluationReport[] = [];

  constructor() {
    this.trendAnalyzer = new TrendAnalyzer();
  }

  addReport(report: EvaluationReport): void {
    this.reports.push(report);
    this.trendAnalyzer.recordMetrics(report.timestamp, report.metrics);
    this.logger.info(`Added report to dashboard data`);
  }

  generateDashboard(
    periodStart: Date,
    periodEnd: Date
  ): DashboardData {
    try {
      const reportsInPeriod = this.reports.filter(
        r => r.timestamp >= periodStart && r.timestamp <= periodEnd
      );

      if (reportsInPeriod.length === 0) {
        return this.getEmptyDashboard(periodStart, periodEnd);
      }

      const currentMetrics = reportsInPeriod[reportsInPeriod.length - 1].metrics;
      const trends = this.trendAnalyzer.getTrends();
      const regressions = this.detectRegressions(reportsInPeriod);
      const improvements = this.detectImprovements(reportsInPeriod);
      const executionStats = this.calculateExecutionStats(reportsInPeriod);
      const modelComparison = this.compareModels(reportsInPeriod);
      const promptVersionComparison = this.comparePromptVersions(reportsInPeriod);

      return {
        timestamp: new Date(),
        periodStart,
        periodEnd,
        metrics: currentMetrics,
        trends,
        regressions,
        improvements,
        executionStats,
        modelComparison,
        promptVersionComparison,
      };
    } catch (error) {
      this.logger.error(`Failed to generate dashboard: ${error}`);
      return this.getEmptyDashboard(periodStart, periodEnd);
    }
  }

  generateHtmlDashboard(dashboard: DashboardData): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Evaluation Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background-color: #1a73e8; color: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .metric-card { background: white; padding: 20px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .metric-value { font-size: 32px; font-weight: bold; color: #1a73e8; }
    .metric-label { color: #666; margin-top: 10px; }
    .section { background: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section h2 { margin-top: 0; color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #f0f0f0; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .positive { color: #34a853; font-weight: bold; }
    .negative { color: #ea4335; font-weight: bold; }
    .neutral { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Evaluation Dashboard</h1>
      <p>Period: ${dashboard.periodStart.toLocaleDateString()} - ${dashboard.periodEnd.toLocaleDateString()}</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${dashboard.metrics.promptQuality}%</div>
        <div class="metric-label">Prompt Quality</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${dashboard.metrics.memoryRecallRate}%</div>
        <div class="metric-label">Memory Recall</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${dashboard.metrics.contextQuality}%</div>
        <div class="metric-label">Context Quality</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${dashboard.metrics.empathyScore}%</div>
        <div class="metric-label">Empathy Score</div>
      </div>
    </div>

    <div class="section">
      <h2>Execution Statistics</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Total Evaluations</td>
          <td>${dashboard.executionStats.totalEvaluations}</td>
        </tr>
        <tr>
          <td>Completed</td>
          <td>${dashboard.executionStats.completedEvaluations}</td>
        </tr>
        <tr>
          <td>Failed</td>
          <td>${dashboard.executionStats.failedEvaluations}</td>
        </tr>
        <tr>
          <td>Average Duration</td>
          <td>${dashboard.executionStats.averageDuration}ms</td>
        </tr>
        <tr>
          <td>Total Cost</td>
          <td>\$${dashboard.executionStats.totalCost.toFixed(4)}</td>
        </tr>
      </table>
    </div>

    ${dashboard.modelComparison.length > 0 ? `
    <div class="section">
      <h2>Model Comparison</h2>
      <table>
        <tr>
          <th>Model</th>
          <th>Quality</th>
          <th>Latency</th>
          <th>Cost</th>
        </tr>
        ${dashboard.modelComparison.map(m => `
        <tr>
          <td>${m.model}</td>
          <td>${m.quality}</td>
          <td>${m.latency}ms</td>
          <td>\$${m.cost.toFixed(4)}</td>
        </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}

    ${dashboard.promptVersionComparison.length > 0 ? `
    <div class="section">
      <h2>Prompt Version Comparison</h2>
      <table>
        <tr>
          <th>Version</th>
          <th>Quality</th>
          <th>Change</th>
        </tr>
        ${dashboard.promptVersionComparison.map(p => `
        <tr>
          <td>${p.version}</td>
          <td>${p.metrics.promptQuality}%</td>
          <td class="${p.performanceDelta > 0 ? 'positive' : p.performanceDelta < 0 ? 'negative' : 'neutral'}">
            ${p.performanceDelta > 0 ? '+' : ''}${p.performanceDelta.toFixed(1)}%
          </td>
        </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}

  </div>
</body>
</html>
    `;

    return html;
  }

  private getEmptyDashboard(periodStart: Date, periodEnd: Date): DashboardData {
    return {
      timestamp: new Date(),
      periodStart,
      periodEnd,
      metrics: {
        memoryRecallRate: 0,
        memoryPrecisionRate: 0,
        relationshipConsistency: 0,
        promptQuality: 0,
        contextQuality: 0,
        averageLatency: 0,
        totalTokenUsage: 0,
        estimatedCost: 0,
        hallucinationRate: 0,
        empathyScore: 0,
        humourScore: 0,
        personalityConsistency: 0,
        conversationContinuity: 0,
      },
      trends: [],
      regressions: [],
      improvements: [],
      executionStats: {
        totalEvaluations: 0,
        completedEvaluations: 0,
        failedEvaluations: 0,
        averageDuration: 0,
        totalCost: 0,
      },
      modelComparison: [],
      promptVersionComparison: [],
    };
  }

  private detectRegressions(reports: EvaluationReport[]): any[] {
    if (reports.length < 2) {
      return [];
    }

    const prev = reports[reports.length - 2];
    const curr = reports[reports.length - 1];

    return curr.regressions || [];
  }

  private detectImprovements(reports: EvaluationReport[]): any[] {
    if (reports.length < 2) {
      return [];
    }

    const curr = reports[reports.length - 1];
    return curr.improvements || [];
  }

  private calculateExecutionStats(reports: EvaluationReport[]): any {
    const total = reports.reduce((sum, r) => sum + r.totalScenarios, 0);
    const completed = reports.reduce((sum, r) => sum + r.passedScenarios, 0);
    const failed = reports.reduce((sum, r) => sum + r.failedScenarios, 0);
    const avgLatency = Math.round(
      reports.reduce((sum, r) => sum + (r.metrics.averageLatency || 0), 0) /
        reports.length
    );
    const totalCost = reports.reduce((sum, r) => sum + (r.metrics.estimatedCost || 0), 0);

    return {
      totalEvaluations: total,
      completedEvaluations: completed,
      failedEvaluations: failed,
      averageDuration: avgLatency,
      totalCost,
    };
  }

  private compareModels(reports: EvaluationReport[]): ModelComparisonData[] {
    const modelMap = new Map<string, EvaluationReport[]>();

    reports.forEach(report => {
      if (!modelMap.has(report.modelProvider)) {
        modelMap.set(report.modelProvider, []);
      }
      modelMap.get(report.modelProvider)!.push(report);
    });

    const comparisons: ModelComparisonData[] = [];

    modelMap.forEach((modelReports, model) => {
      const latest = modelReports[modelReports.length - 1];
      const metrics = latest.metrics;

      comparisons.push({
        model: model as any,
        metrics,
        cost: metrics.estimatedCost,
        latency: metrics.averageLatency,
        quality: Math.round(
          (metrics.promptQuality +
            metrics.memoryRecallRate +
            metrics.contextQuality +
            metrics.empathyScore) /
            4
        ),
      });
    });

    return comparisons;
  }

  private comparePromptVersions(reports: EvaluationReport[]): PromptVersionComparison[] {
    const versionMap = new Map<string, EvaluationReport[]>();

    reports.forEach(report => {
      if (!versionMap.has(report.promptVersion)) {
        versionMap.set(report.promptVersion, []);
      }
      versionMap.get(report.promptVersion)!.push(report);
    });

    const comparisons: PromptVersionComparison[] = [];

    versionMap.forEach((versionReports, version) => {
      const latest = versionReports[versionReports.length - 1];
      const previous = versionReports.length > 1 ? versionReports[versionReports.length - 2] : null;

      const performanceDelta = previous
        ? this.calculatePerformanceDelta(previous.metrics, latest.metrics)
        : 0;

      comparisons.push({
        version,
        metrics: latest.metrics,
        changesSummary: this.generateChangesSummary(version),
        performanceDelta,
      });
    });

    return comparisons.sort((a, b) => b.performanceDelta - a.performanceDelta);
  }

  private calculatePerformanceDelta(prev: ReportMetrics, curr: ReportMetrics): number {
    const prevScore = (prev.promptQuality + prev.memoryRecallRate + prev.contextQuality) / 3;
    const currScore = (curr.promptQuality + curr.memoryRecallRate + curr.contextQuality) / 3;
    return currScore - prevScore;
  }

  private generateChangesSummary(version: string): string {
    const versionParts = version.split('.');
    const patch = parseInt(versionParts[2], 10);
    const minor = parseInt(versionParts[1], 10);

    if (patch > 0) {
      return 'Bug fixes';
    }

    if (minor > 0) {
      return 'New features';
    }

    return 'Initial';
  }

  clearReports(): void {
    this.reports = [];
    this.logger.info('Cleared all reports');
  }
}
