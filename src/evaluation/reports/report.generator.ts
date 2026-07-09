/**
 * Report Generator
 * Generates evaluation reports in multiple formats
 */

import {
  EvaluationReport,
  EvaluationResult,
  ReportMetrics,
  EvaluationDatasetType,
  ModelProvider,
  RegressionItem,
  ImprovementItem,
} from '../types';
import { createLogger } from '@utils/logger';
import { MetricsCalculator } from '../metrics';
import { TrendAnalyzer } from '../metrics/trend.analyzer';
import { v4 as uuidv4 } from 'uuid';

export class ReportGenerator {
  private logger = createLogger(this.constructor.name);
  private metricsCalculator: MetricsCalculator;
  private trendAnalyzer: TrendAnalyzer;

  constructor() {
    this.metricsCalculator = new MetricsCalculator();
    this.trendAnalyzer = new TrendAnalyzer();
  }

  generateReport(
    results: EvaluationResult[],
    datasetType: EvaluationDatasetType,
    modelProvider: ModelProvider,
    promptVersion: string,
    previousReport?: EvaluationReport
  ): EvaluationReport {
    try {
      const totalScenarios = results.length;
      const passedScenarios = results.filter(r => r.passed).length;
      const failedScenarios = totalScenarios - passedScenarios;
      const averageScore =
        totalScenarios > 0
          ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalScenarios)
          : 0;

      const metrics = this.metricsCalculator.calculateMetrics(results);
      this.trendAnalyzer.recordMetrics(new Date(), metrics);

      const regressions = previousReport
        ? this.detectRegressions(previousReport.metrics, metrics)
        : [];

      const improvements = previousReport
        ? this.detectImprovements(previousReport.metrics, metrics)
        : [];

      const recommendations = this.generateRecommendations(
        metrics,
        regressions,
        improvements
      );

      const report: EvaluationReport = {
        id: uuidv4(),
        timestamp: new Date(),
        datasetType,
        totalScenarios,
        passedScenarios,
        failedScenarios,
        averageScore,
        metrics,
        regressions,
        improvements,
        recommendations,
        modelProvider,
        promptVersion,
      };

      this.logger.info(
        `Generated report: ${passedScenarios}/${totalScenarios} passed, score=${averageScore}`
      );

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error}`);
      throw error;
    }
  }

  generateJsonReport(report: EvaluationReport): string {
    return JSON.stringify(report, null, 2);
  }

  generateMarkdownReport(report: EvaluationReport): string {
    let md = `# Evaluation Report\n\n`;

    md += `**Generated:** ${report.timestamp.toISOString()}\n`;
    md += `**Dataset:** ${report.datasetType}\n`;
    md += `**Model:** ${report.modelProvider}\n`;
    md += `**Prompt Version:** ${report.promptVersion}\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Scenarios | ${report.totalScenarios} |\n`;
    md += `| Passed | ${report.passedScenarios} |\n`;
    md += `| Failed | ${report.failedScenarios} |\n`;
    md += `| Pass Rate | ${((report.passedScenarios / report.totalScenarios) * 100).toFixed(1)}% |\n`;
    md += `| Average Score | ${report.averageScore} |\n\n`;

    md += `## Metrics\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Memory Recall Rate | ${report.metrics.memoryRecallRate}% |\n`;
    md += `| Memory Precision Rate | ${report.metrics.memoryPrecisionRate}% |\n`;
    md += `| Relationship Consistency | ${report.metrics.relationshipConsistency}% |\n`;
    md += `| Prompt Quality | ${report.metrics.promptQuality}% |\n`;
    md += `| Context Quality | ${report.metrics.contextQuality}% |\n`;
    md += `| Empathy Score | ${report.metrics.empathyScore}% |\n`;
    md += `| Humour Score | ${report.metrics.humourScore}% |\n`;
    md += `| Personality Consistency | ${report.metrics.personalityConsistency}% |\n`;
    md += `| Conversation Continuity | ${report.metrics.conversationContinuity}% |\n`;
    md += `| Hallucination Rate | ${report.metrics.hallucinationRate}% |\n`;
    md += `| Average Latency | ${report.metrics.averageLatency}ms |\n`;
    md += `| Total Tokens | ${report.metrics.totalTokenUsage} |\n`;
    md += `| Estimated Cost | $${report.metrics.estimatedCost.toFixed(4)} |\n\n`;

    if (report.regressions.length > 0) {
      md += `## Regressions (${report.regressions.length})\n\n`;
      md += `| Scenario | Previous | Current | Severity |\n`;
      md += `|----------|----------|---------|----------|\n`;
      report.regressions.forEach(r => {
        md += `| ${r.scenarioId} | ${r.previousScore} | ${r.currentScore} | ${r.severity} |\n`;
      });
      md += '\n';
    }

    if (report.improvements.length > 0) {
      md += `## Improvements (${report.improvements.length})\n\n`;
      md += `| Scenario | Previous | Current | Magnitude |\n`;
      md += `|----------|----------|---------|----------|\n`;
      report.improvements.forEach(i => {
        md += `| ${i.scenarioId} | ${i.previousScore} | ${i.currentScore} | ${i.magnitude} |\n`;
      });
      md += '\n';
    }

    if (report.recommendations.length > 0) {
      md += `## Recommendations\n\n`;
      report.recommendations.forEach(r => {
        md += `- ${r}\n`;
      });
    }

    return md;
  }

  generateCsvReport(report: EvaluationReport): string {
    const lines: string[] = [];

    lines.push('Report Summary');
    lines.push(`Generated,${report.timestamp.toISOString()}`);
    lines.push(`Dataset,${report.datasetType}`);
    lines.push(`Model,${report.modelProvider}`);
    lines.push(`Prompt Version,${report.promptVersion}`);
    lines.push('');

    lines.push('Results');
    lines.push(
      `Total Scenarios,${report.totalScenarios},Passed,${report.passedScenarios},Failed,${report.failedScenarios},Pass Rate,${((report.passedScenarios / report.totalScenarios) * 100).toFixed(1)}%`
    );
    lines.push('');

    lines.push('Metrics');
    lines.push('Metric,Value');
    lines.push(`Memory Recall Rate,${report.metrics.memoryRecallRate}%`);
    lines.push(`Memory Precision Rate,${report.metrics.memoryPrecisionRate}%`);
    lines.push(`Relationship Consistency,${report.metrics.relationshipConsistency}%`);
    lines.push(`Prompt Quality,${report.metrics.promptQuality}%`);
    lines.push(`Context Quality,${report.metrics.contextQuality}%`);
    lines.push(`Empathy Score,${report.metrics.empathyScore}%`);
    lines.push(`Humour Score,${report.metrics.humourScore}%`);
    lines.push(`Personality Consistency,${report.metrics.personalityConsistency}%`);
    lines.push(`Conversation Continuity,${report.metrics.conversationContinuity}%`);
    lines.push(`Hallucination Rate,${report.metrics.hallucinationRate}%`);
    lines.push(`Average Latency,${report.metrics.averageLatency}ms`);

    return lines.join('\n');
  }

  private detectRegressions(
    previousMetrics: ReportMetrics,
    currentMetrics: ReportMetrics
  ): RegressionItem[] {
    const regressions: RegressionItem[] = [];
    const threshold = 5;

    const metricsToCheck: Array<keyof ReportMetrics> = [
      'memoryRecallRate',
      'memoryPrecisionRate',
      'relationshipConsistency',
      'promptQuality',
      'contextQuality',
      'empathyScore',
      'personalityConsistency',
    ];

    metricsToCheck.forEach(metric => {
      const prev = previousMetrics[metric] as number;
      const curr = currentMetrics[metric] as number;
      const diff = prev - curr;

      if (diff > threshold) {
        regressions.push({
          scenarioId: `metric-${metric}`,
          scenarioType: 'PROMPT_QUALITY' as any,
          previousScore: prev,
          currentScore: curr,
          difference: diff,
          severity: diff > 20 ? 'critical' : diff > 15 ? 'high' : diff > 10 ? 'medium' : 'low',
        });
      }
    });

    return regressions;
  }

  private detectImprovements(
    previousMetrics: ReportMetrics,
    currentMetrics: ReportMetrics
  ): ImprovementItem[] {
    const improvements: ImprovementItem[] = [];
    const threshold = 5;

    const metricsToCheck: Array<keyof ReportMetrics> = [
      'memoryRecallRate',
      'memoryPrecisionRate',
      'relationshipConsistency',
      'promptQuality',
      'contextQuality',
      'empathyScore',
      'personalityConsistency',
    ];

    metricsToCheck.forEach(metric => {
      const prev = previousMetrics[metric] as number;
      const curr = currentMetrics[metric] as number;
      const diff = curr - prev;

      if (diff > threshold) {
        improvements.push({
          scenarioId: `metric-${metric}`,
          scenarioType: 'PROMPT_QUALITY' as any,
          previousScore: prev,
          currentScore: curr,
          difference: diff,
          magnitude: diff > 15 ? 'large' : diff > 10 ? 'medium' : 'small',
        });
      }
    });

    return improvements;
  }

  private generateRecommendations(
    metrics: ReportMetrics,
    regressions: RegressionItem[],
    improvements: ImprovementItem[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.memoryRecallRate < 60) {
      recommendations.push('Memory recall is low. Consider enhancing memory storage or retrieval logic.');
    }

    if (metrics.hallucinationRate > 20) {
      recommendations.push('Hallucination rate is high. Review factual grounding mechanisms.');
    }

    if (metrics.empathyScore < 50) {
      recommendations.push('Empathy score needs improvement. Enhance emotional response capabilities.');
    }

    if (metrics.contextQuality < 60) {
      recommendations.push('Context quality is low. Improve world state awareness and utilization.');
    }

    if (metrics.personalityConsistency < 65) {
      recommendations.push('Personality consistency varies. Reinforce core personality traits across responses.');
    }

    if (regressions.length > 0) {
      recommendations.push(
        `Address ${regressions.length} regression(s) in recent metrics.`
      );
    }

    if (improvements.length > 0) {
      recommendations.push(
        `Leverage ${improvements.length} identified improvement(s) across the system.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('System performing well. Continue monitoring key metrics.');
    }

    return recommendations;
  }
}
