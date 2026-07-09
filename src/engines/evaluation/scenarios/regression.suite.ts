/**
 * Production Regression Suite
 * Comprehensive regression testing with 500+ scenarios
 */

import { ScenarioGenerator } from './scenario.generator';
import { DatasetGenerator } from './dataset.generator';
import { ScenarioExecutor } from './scenario.executor';
import { ReportGenerator } from './report.generator';
import {
  EvaluationScenario,
  ScenarioResult,
  ScenarioDataset,
  ScenarioDatasetType,
} from './scenario.types';
import { createLogger } from '@utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class ProductionRegressionSuite {
  private logger = createLogger(this.constructor.name);
  private scenarioGenerator: ScenarioGenerator;
  private datasetGenerator: DatasetGenerator;
  private scenarioExecutor: ScenarioExecutor;
  private reportGenerator: ReportGenerator;
  private scenarios: EvaluationScenario[] = [];
  private datasets: ScenarioDataset[] = [];
  private results: Record<string, ScenarioResult[]> = {};

  constructor() {
    this.scenarioGenerator = new ScenarioGenerator();
    this.datasetGenerator = new DatasetGenerator();
    this.scenarioExecutor = new ScenarioExecutor();
    this.reportGenerator = new ReportGenerator();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Production Regression Suite');

    this.scenarios = this.scenarioGenerator.generateAllScenarios();
    this.logger.info(`Generated ${this.scenarios.length} scenarios`);

    this.datasets = this.datasetGenerator.generateAllDatasets();
    this.logger.info(`Generated ${this.datasets.length} datasets`);
  }

  async executeAllTests(): Promise<Record<string, ScenarioResult[]>> {
    this.logger.info('Starting comprehensive regression testing');

    this.results = await this.scenarioExecutor.executeAllDatasets(this.datasets);

    this.logger.info('All regression tests completed');

    return this.results;
  }

  async executeDatasetType(
    datasetType: ScenarioDatasetType
  ): Promise<ScenarioResult[]> {
    const dataset = this.datasets.find(d => d.type === datasetType);

    if (!dataset) {
      throw new Error(`Dataset type ${datasetType} not found`);
    }

    return this.scenarioExecutor.executeDataset(dataset);
  }

  async generateAllReports(outputDir: string): Promise<void> {
    this.logger.info(`Generating reports to ${outputDir}`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const [datasetName, results] of Object.entries(this.results)) {
      const dataset = this.datasets.find(d => d.name === datasetName);

      if (!dataset) continue;

      await this.generateMarkdownReport(dataset, results, outputDir);
      await this.generateJSONReport(dataset, results, outputDir);
      await this.generateCSVReport(dataset, results, outputDir);
      await this.generateHTMLReport(dataset, results, outputDir);
    }

    this.logger.info('Reports generated successfully');
  }

  async generateComprehensiveReport(outputDir: string): Promise<void> {
    this.logger.info('Generating comprehensive regression report');

    const allResults: ScenarioResult[] = [];
    for (const results of Object.values(this.results)) {
      allResults.push(...results);
    }

    const summaryMarkdown = this.generateComprehensiveSummary(allResults);
    fs.writeFileSync(
      path.join(outputDir, '00-REGRESSION_SUMMARY.md'),
      summaryMarkdown
    );

    this.logger.info('Comprehensive report generated');
  }

  private generateComprehensiveSummary(results: ScenarioResult[]): string {
    const md: string[] = [];

    md.push('# Production Regression Suite Report\n');
    md.push(`**Generated:** ${new Date().toISOString()}\n`);
    md.push(`**Total Scenarios:** ${this.scenarios.length}\n`);
    md.push(`**Total Executions:** ${results.length}\n\n`);

    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const passRate = ((passed / results.length) * 100).toFixed(2);

    md.push('## Executive Summary\n\n');
    md.push(`| Metric | Value |\n`);
    md.push(`|--------|-------|\n`);
    md.push(`| Total Scenarios | ${this.scenarios.length} |\n`);
    md.push(`| Total Executions | ${results.length} |\n`);
    md.push(`| Passed | ${passed} |\n`);
    md.push(`| Failed | ${failed} |\n`);
    md.push(`| Pass Rate | ${passRate}% |\n`);
    md.push(`| Regression Tests Passed | ${results.filter(r => r.regressionPassed).length} |\n`);
    md.push(`| Average Duration | ${(results.reduce((a, b) => a + b.duration, 0) / results.length).toFixed(2)}ms |\n\n`);

    md.push('## Category Breakdown\n\n');
    md.push(`| Category | Count | Pass Rate |\n`);
    md.push(`|----------|-------|----------|\n`);

    const categoryCount: Record<string, number> = {};
    const categoryPassed: Record<string, number> = {};

    for (const scenario of this.scenarios) {
      const cat = scenario.category;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      const categoryResults = results.filter(r =>
        r.scenarioId.includes(cat)
      );
      categoryPassed[cat] = categoryResults.filter(r => r.success).length;
    }

    for (const [category, count] of Object.entries(categoryCount)) {
      const categoryPassed_val = categoryPassed[category] || 0;
      const rate = ((categoryPassed_val / count) * 100).toFixed(1);
      md.push(`| ${category} | ${count} | ${rate}% |\n`);
    }

    md.push('\n## Dataset Breakdown\n\n');
    md.push(`| Dataset | Type | Scenarios | Passed | Pass Rate |\n`);
    md.push(`|---------|------|-----------|--------|----------|\n`);

    for (const dataset of this.datasets) {
      const datasetResults = results.filter(
        r => r.datasetType === dataset.type
      );
      const passed_val = datasetResults.filter(r => r.success).length;
      const rate = ((passed_val / datasetResults.length) * 100).toFixed(1);
      md.push(
        `| ${dataset.name} | ${dataset.type} | ${datasetResults.length} | ${passed_val} | ${rate}% |\n`
      );
    }

    md.push('\n## Regression Analysis\n\n');
    const regressionPassed = results.filter(r => r.regressionPassed).length;
    md.push(`- **Regression Tests Passed:** ${regressionPassed}/${results.length}\n`);
    md.push(
      `- **Regression Failure Rate:** ${(((results.length - regressionPassed) / results.length) * 100).toFixed(2)}%\n\n`
    );

    const regressionFailures = results.filter(r => !r.regressionPassed);
    if (regressionFailures.length > 0) {
      md.push('### Critical Regression Failures\n\n');

      for (const result of regressionFailures.slice(0, 20)) {
        md.push(`- **${result.scenarioId}**\n`);
        for (const failure of result.regressionFailures) {
          md.push(`  - ${failure}\n`);
        }
      }
    }

    md.push('\n## Evaluation Metrics\n\n');
    md.push(`| Metric | Average Score | Min | Max |\n`);
    md.push(`|--------|----------------|-----|-----|\n`);

    const metricKeys = [
      'memoryRecallScore',
      'relationshipAccuracy',
      'emotionalIntelligence',
      'contextRelevance',
      'promptQuality',
      'worldConsistency',
      'conversationContinuity',
      'momentRelevance',
      'notificationRelevance',
      'safetyScore',
      'hallucination',
      'consistencyOverTime',
      'overallScore',
    ];

    for (const key of metricKeys) {
      const scores = results
        .map(r => (r.actualEvaluation as Record<string, any>)[key])
        .filter(s => s !== undefined);

      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const min = Math.min(...scores);
        const max = Math.max(...scores);

        md.push(
          `| ${key} | ${avg.toFixed(3)} | ${min.toFixed(3)} | ${max.toFixed(3)} |\n`
        );
      }
    }

    md.push('\n## Performance Statistics\n\n');
    const durations = results.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
    const p99Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.99)];

    md.push(`- **Average Duration:** ${avgDuration.toFixed(2)}ms\n`);
    md.push(`- **Min Duration:** ${minDuration}ms\n`);
    md.push(`- **Max Duration:** ${maxDuration}ms\n`);
    md.push(`- **P95 Duration:** ${p95Duration}ms\n`);
    md.push(`- **P99 Duration:** ${p99Duration}ms\n`);

    md.push('\n## Recommendations\n\n');
    md.push('1. Review all regression failures immediately\n');
    md.push('2. Prioritize safety and hallucination detection scenarios\n');
    md.push('3. Investigate performance degradation if P95/P99 exceed thresholds\n');
    md.push('4. Continue monitoring memory recall and relationship evolution\n');
    md.push('5. Maintain high pass rate for conversation continuity scenarios\n');

    return md.join('');
  }

  private async generateMarkdownReport(
    dataset: ScenarioDataset,
    results: ScenarioResult[],
    outputDir: string
  ): Promise<void> {
    const markdown = this.reportGenerator.generateMarkdownReport(dataset, results);
    const filename = path.join(
      outputDir,
      `${dataset.type}-report.md`
    );
    fs.writeFileSync(filename, markdown);
    this.logger.debug(`Generated Markdown report: ${filename}`);
  }

  private async generateJSONReport(
    dataset: ScenarioDataset,
    results: ScenarioResult[],
    outputDir: string
  ): Promise<void> {
    const json = this.reportGenerator.generateJSONReport(dataset, results);
    const filename = path.join(
      outputDir,
      `${dataset.type}-report.json`
    );
    fs.writeFileSync(filename, JSON.stringify(json, null, 2));
    this.logger.debug(`Generated JSON report: ${filename}`);
  }

  private async generateCSVReport(
    dataset: ScenarioDataset,
    results: ScenarioResult[],
    outputDir: string
  ): Promise<void> {
    const csv = this.reportGenerator.generateCSVReport(dataset, results);
    const filename = path.join(
      outputDir,
      `${dataset.type}-report.csv`
    );
    fs.writeFileSync(filename, csv);
    this.logger.debug(`Generated CSV report: ${filename}`);
  }

  private async generateHTMLReport(
    dataset: ScenarioDataset,
    results: ScenarioResult[],
    outputDir: string
  ): Promise<void> {
    const html = this.reportGenerator.generateHTMLReport(dataset, results);
    const filename = path.join(
      outputDir,
      `${dataset.type}-report.html`
    );
    fs.writeFileSync(filename, html);
    this.logger.debug(`Generated HTML report: ${filename}`);
  }

  getScenarioCount(): number {
    return this.scenarios.length;
  }

  getDatasetCount(): number {
    return this.datasets.length;
  }

  getScenarios(): EvaluationScenario[] {
    return this.scenarios;
  }

  getDatasets(): ScenarioDataset[] {
    return this.datasets;
  }

  getResults(): Record<string, ScenarioResult[]> {
    return this.results;
  }
}
