/**
 * Report Generator
 * Generates reports in multiple formats
 */

import { ScenarioResult, ScenarioDataset } from './scenario.types';

export class ReportGenerator {

  generateMarkdownReport(
    dataset: ScenarioDataset,
    results: ScenarioResult[]
  ): string {
    const md: string[] = [];

    if (results.length === 0) {
      return `# ${dataset.name} Report\n\n**No results available. Execute tests first.`
    }

    md.push(`# ${dataset.name} Report\n`);
    md.push(`**Generated:** ${new Date().toISOString()}\n`);
    md.push(`**Type:** ${dataset.type}\n`);
    md.push(`**Total Scenarios:** ${dataset.metadata.totalScenarios}\n\n`);

    md.push('## Execution Summary\n');
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const passRate = ((passed / results.length) * 100).toFixed(2);

    md.push(`- **Total Executions:** ${results.length}\n`);
    md.push(`- **Passed:** ${passed}\n`);
    md.push(`- **Failed:** ${failed}\n`);
    md.push(`- **Pass Rate:** ${passRate}%\n\n`);

    md.push('## Category Distribution\n');
    for (const [category, count] of Object.entries(dataset.metadata.categories)) {
      md.push(`- ${category}: ${count}\n`);
    }
    md.push('\n');

    md.push('## Priority Distribution\n');
    for (const [priority, count] of Object.entries(dataset.metadata.priorities)) {
      md.push(`- ${priority}: ${count}\n`);
    }
    md.push('\n');

    md.push('## Regression Analysis\n');
    const regressionPassed = results.filter(r => r.regressionPassed).length;
    const regressionFailures = results.filter(r => !r.regressionPassed);

    md.push(`- **Regression Tests Passed:** ${regressionPassed}/${results.length}\n`);
    md.push(
      `- **Regression Failure Rate:** ${(((results.length - regressionPassed) / results.length) * 100).toFixed(2)}%\n\n`
    );

    if (regressionFailures.length > 0) {
      md.push('### Failed Regression Tests\n\n');
      for (const result of regressionFailures.slice(0, 10)) {
        md.push(`#### Scenario: ${result.scenarioId}\n`);
        md.push(`- **Failures:** ${result.regressionFailures.join(', ')}\n`);
        md.push(`- **Duration:** ${result.duration}ms\n\n`);
      }
    }

    md.push('## Execution Metrics\n');
    const durations = results.map(r => r.duration);
    const avgDuration =
      durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    md.push(`- **Average Duration:** ${avgDuration.toFixed(2)}ms\n`);
    md.push(`- **Max Duration:** ${maxDuration}ms\n`);
    md.push(`- **Min Duration:** ${minDuration}ms\n\n`);

    md.push('## Evaluation Scores Summary\n\n');
    const scoreKeys = [
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

    for (const key of scoreKeys) {
      const scores = results
        .map(r => (r.actualEvaluation as Record<string, any>)[key])
        .filter(s => s !== undefined);
      if (scores.length > 0) {
        const avg =
          scores.reduce((a, b) => a + b, 0) / scores.length;
        md.push(`- **${key}:** ${avg.toFixed(3)}\n`);
      }
    }

    return md.join('');
  }

  generateJSONReport(
    dataset: ScenarioDataset,
    results: ScenarioResult[]
  ): Record<string, any> {
    if (results.length === 0) {
      return {
        metadata: {
          name: dataset.name,
          type: dataset.type,
          generatedAt: new Date().toISOString(),
          datasetMetadata: dataset.metadata,
        },
        summary: {
          totalScenarios: 0,
          executedScenarios: 0,
          passedScenarios: 0,
          failedScenarios: 0,
          regressionTestsPassed: 0,
        },
        results: [],
        categoryMetrics: {},
        evaluationMetrics: {},
      };
    }

    return {
      metadata: {
        name: dataset.name,
        type: dataset.type,
        generatedAt: new Date().toISOString(),
        datasetMetadata: dataset.metadata,
      },
      summary: {
        totalScenarios: dataset.metadata.totalScenarios,
        executedScenarios: results.length,
        passedScenarios: results.filter(r => r.success).length,
        failedScenarios: results.filter(r => !r.success).length,
        regressionTestsPassed: results.filter(r => r.regressionPassed).length,
      },
      results,
      categoryMetrics: this.calculateCategoryMetrics(results),
      evaluationMetrics: this.calculateEvaluationMetrics(results),
    };
  }

  private escapeCSVValue(value: string | number | boolean): string {
    const str = String(value);
    if (
      str.includes(',') ||
      str.includes('"') ||
      str.includes('\n') ||
      /^[=+\-@]/.test(str)
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  generateCSVReport(
    _dataset: ScenarioDataset,
    results: ScenarioResult[]
  ): string {
    if (results.length === 0) {
      return 'No results available. Execute tests first.';
    }

    const lines: string[] = [];

    const headers = [
      'ScenarioId',
      'DatasetType',
      'ExecutedAt',
      'Duration',
      'Success',
      'RegressionPassed',
      'ErrorCount',
      'WarningCount',
      'MemoryScore',
      'RelationshipScore',
      'EmotionalScore',
      'ContextScore',
      'PromptScore',
      'WorldScore',
      'ContinuityScore',
      'MomentScore',
      'NotificationScore',
      'SafetyScore',
      'HallucinationScore',
      'ConsistencyScore',
      'OverallScore',
    ];

    lines.push(headers.join(','));

    for (const result of results) {
      const row = [
        this.escapeCSVValue(result.scenarioId),
        this.escapeCSVValue(result.datasetType),
        this.escapeCSVValue(result.executedAt.toISOString()),
        result.duration,
        result.success ? 'PASS' : 'FAIL',
        result.regressionPassed ? 'PASS' : 'FAIL',
        result.errors.length,
        result.warnings.length,
        result.actualEvaluation.memoryRecallScore.toFixed(3),
        result.actualEvaluation.relationshipAccuracy.toFixed(3),
        result.actualEvaluation.emotionalIntelligence.toFixed(3),
        result.actualEvaluation.contextRelevance.toFixed(3),
        result.actualEvaluation.promptQuality.toFixed(3),
        result.actualEvaluation.worldConsistency.toFixed(3),
        result.actualEvaluation.conversationContinuity.toFixed(3),
        result.actualEvaluation.momentRelevance.toFixed(3),
        result.actualEvaluation.notificationRelevance.toFixed(3),
        result.actualEvaluation.safetyScore.toFixed(3),
        result.actualEvaluation.hallucination.toFixed(3),
        result.actualEvaluation.consistencyOverTime.toFixed(3),
        result.actualEvaluation.overallScore.toFixed(3),
      ];

      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  generateHTMLReport(
    dataset: ScenarioDataset,
    results: ScenarioResult[]
  ): string {
    if (results.length === 0) {
      return `<!DOCTYPE html>
<html>
<head>
    <title>${dataset.name} Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${dataset.name}</h1>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Type:</strong> ${dataset.type}</p>
        <p>No results available. Execute tests first.</p>
    </div>
</body>
</html>`;
    }

    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const passRate = ((passed / results.length) * 100).toFixed(2);

    const evaluationMetrics = this.calculateEvaluationMetrics(results);

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>${dataset.name} Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .summary-card {
            background-color: #f9f9f9;
            border-left: 4px solid #007bff;
            padding: 15px;
            border-radius: 4px;
        }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #007bff; }
        .summary-card .label { font-size: 12px; color: #666; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background-color: #007bff;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .pass { color: #28a745; font-weight: bold; }
        .fail { color: #dc3545; font-weight: bold; }
        .chart-container {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${dataset.name}</h1>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Type:</strong> ${dataset.type}</p>
        <p><strong>Total Scenarios:</strong> ${dataset.metadata.totalScenarios}</p>

        <h2>Execution Summary</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Executions</h3>
                <div class="value">${results.length}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="value pass">${passed}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="value fail">${failed}</div>
            </div>
            <div class="summary-card">
                <h3>Pass Rate</h3>
                <div class="value">${passRate}%</div>
            </div>
        </div>

        <h2>Category Distribution</h2>
        <table>
            <tr><th>Category</th><th>Count</th><th>Pass Rate</th></tr>
            ${Object.entries(dataset.metadata.categories)
              .map(
                ([category, count]) => `
                <tr>
                    <td>${category}</td>
                    <td>${count}</td>
                    <td>${this.getCategoryPassRate(category, results).toFixed(1)}%</td>
                </tr>
            `
              )
              .join('')}
        </table>

        <h2>Evaluation Metrics</h2>
        <table>
            <tr><th>Metric</th><th>Average Score</th></tr>
            ${Object.entries(evaluationMetrics)
              .map(
                ([metric, score]) => `
                <tr>
                    <td>${metric}</td>
                    <td>${(score as number).toFixed(3)}</td>
                </tr>
            `
              )
              .join('')}
        </table>

        <h2>Performance Metrics</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Avg Duration</h3>
                <div class="value">${(results.reduce((a, b) => a + b.duration, 0) / results.length).toFixed(2)}ms</div>
            </div>
            <div class="summary-card">
                <h3>Max Duration</h3>
                <div class="value">${Math.max(...results.map(r => r.duration))}ms</div>
            </div>
            <div class="summary-card">
                <h3>Min Duration</h3>
                <div class="value">${Math.min(...results.map(r => r.duration))}ms</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  private calculateCategoryMetrics(results: ScenarioResult[]): Record<string, number> {
    const metrics: Record<string, number> = {};

    const categories = Array.from(
      new Set(results.map(r => r.scenarioId.split('-')[1]))
    );

    for (const category of categories) {
      const categoryResults = results.filter(
        r => r.scenarioId.includes(category)
      );
      const passRate =
        categoryResults.filter(r => r.success).length / categoryResults.length;
      metrics[category] = passRate;
    }

    return metrics;
  }

  private calculateEvaluationMetrics(results: ScenarioResult[]): Record<string, number> {
    const metrics: Record<string, number> = {};
    const scoreKeys = [
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

    for (const key of scoreKeys) {
      const scores = results
        .map(r => (r.actualEvaluation as Record<string, any>)[key])
        .filter(s => s !== undefined);
      if (scores.length > 0) {
        metrics[key] =
          scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }

    return metrics;
  }

  private getCategoryPassRate(category: string, results: ScenarioResult[]): number {
    const categoryResults = results.filter(
      r => r.scenarioId.includes(category)
    );
    if (categoryResults.length === 0) return 0;
    return (
      (categoryResults.filter(r => r.success).length / categoryResults.length) * 100
    );
  }
}
