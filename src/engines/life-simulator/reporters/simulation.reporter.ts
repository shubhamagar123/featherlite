/**
 * Simulation Reporter
 * Generates reports in multiple formats
 */

import {
  SimulationResult,
  SimulationMetrics,
} from '../types';

export class SimulationReporter {

  generateMarkdownReport(result: SimulationResult): string {
    let md = `# Simulation Report\n\n`;

    md += `**Actor:** ${result.actorId}\n`;
    md += `**Duration:** ${result.duration}ms\n`;
    md += `**Status:** ${result.status}\n`;
    md += `**Start Time:** ${result.startTime.toISOString()}\n`;
    md += `**End Time:** ${result.endTime.toISOString()}\n\n`;

    md += `## Configuration\n\n`;
    md += `- Timeframe: ${result.configuration.timeframe}\n`;
    md += `- Speed Multiplier: ${result.configuration.speedMultiplier}x\n`;
    md += `- Include Life Events: ${result.configuration.includeLifeEvents}\n`;
    md += `- Include Random Variance: ${result.configuration.includeRandomVariance}\n`;
    md += `- Include Context Evolution: ${result.configuration.includeContextEvolution}\n\n`;

    md += this.getMetricsMarkdown(result.metrics);

    md += `## Timeline Summary\n\n`;
    md += `- Total Days Simulated: ${result.history.snapshots.length}\n`;
    md += `- Total Events: ${result.history.events.length}\n`;
    md += `- Final Mood: ${result.history.finalState.currentMood}\n`;
    md += `- Final Energy: ${result.history.finalState.currentEnergy.toFixed(2)}\n\n`;

    if (result.errors && result.errors.length > 0) {
      md += `## Errors\n\n`;
      result.errors.forEach(err => {
        md += `- ${err}\n`;
      });
    }

    return md;
  }

  generateJsonReport(result: SimulationResult): string {
    return JSON.stringify(result, null, 2);
  }

  generateCsvReport(result: SimulationResult): string {
    const lines: string[] = [];

    lines.push('Simulation Report');
    lines.push(`Actor ID,${result.actorId}`);
    lines.push(`Status,${result.status}`);
    lines.push(`Duration (ms),${result.duration}`);
    lines.push(`Start Time,${result.startTime.toISOString()}`);
    lines.push(`End Time,${result.endTime.toISOString()}`);
    lines.push('');

    lines.push('Metrics');
    lines.push(`Metric,Value`);
    lines.push(`Total Conversations,${result.metrics.totalConversations}`);
    lines.push(`Average Session Length,${result.metrics.averageSessionLength.toFixed(2)}`);
    lines.push(`Relationship Growth,${result.metrics.relationshipGrowth.toFixed(2)}`);
    lines.push(`Memory Growth,${result.metrics.memoryGrowth.toFixed(2)}`);
    lines.push(`Emotional Stability,${result.metrics.emotionalStability.toFixed(2)}`);
    lines.push(`Trust Evolution,${result.metrics.trustEvolution.toFixed(2)}`);
    lines.push(`Comfort Evolution,${result.metrics.comfortEvolution.toFixed(2)}`);
    lines.push(`Context Accuracy,${result.metrics.contextAccuracy.toFixed(2)}`);
    lines.push(`Moment Accuracy,${result.metrics.momentAccuracy.toFixed(2)}`);
    lines.push(`Notification Accuracy,${result.metrics.notificationAccuracy.toFixed(2)}`);
    lines.push(`Retention Rate,${result.metrics.retentionRate.toFixed(2)}`);
    lines.push(`Engagement Score,${result.metrics.engagementScore.toFixed(2)}`);

    return lines.join('\n');
  }

  generateHtmlReport(result: SimulationResult): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Simulation Report - ${result.actorId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 4px; }
    h1 { color: #1a73e8; }
    h2 { color: #333; border-bottom: 2px solid #1a73e8; padding-bottom: 10px; }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric-card { background: #f9f9f9; padding: 15px; border-left: 4px solid #1a73e8; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1a73e8; }
    .metric-label { color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #1a73e8; color: white; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .status-${result.status} { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Simulation Report</h1>
    <p><strong>Actor:</strong> ${result.actorId}</p>
    <p><strong>Status:</strong> <span class="status-${result.status}">${result.status}</span></p>
    <p><strong>Duration:</strong> ${result.duration}ms</p>
    <p><strong>Period:</strong> ${result.startTime.toLocaleDateString()} to ${result.endTime.toLocaleDateString()}</p>

    <h2>Key Metrics</h2>
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-value">${result.metrics.relationshipGrowth.toFixed(1)}</div>
        <div class="metric-label">Relationship Growth</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${result.metrics.memoryGrowth.toFixed(1)}</div>
        <div class="metric-label">Memory Growth</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${result.metrics.trustEvolution.toFixed(1)}</div>
        <div class="metric-label">Trust Evolution</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${result.metrics.engagementScore.toFixed(1)}</div>
        <div class="metric-label">Engagement Score</div>
      </div>
    </div>

    <h2>All Metrics</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total Conversations</td>
          <td>${result.metrics.totalConversations}</td>
        </tr>
        <tr>
          <td>Average Session Length</td>
          <td>${result.metrics.averageSessionLength.toFixed(2)} ms</td>
        </tr>
        <tr>
          <td>Emotional Stability</td>
          <td>${result.metrics.emotionalStability.toFixed(2)}%</td>
        </tr>
        <tr>
          <td>Context Accuracy</td>
          <td>${result.metrics.contextAccuracy.toFixed(2)}%</td>
        </tr>
        <tr>
          <td>Retention Rate</td>
          <td>${result.metrics.retentionRate.toFixed(2)}%</td>
        </tr>
      </tbody>
    </table>

    ${result.errors && result.errors.length > 0 ? `
    <h2>Errors</h2>
    <ul>
      ${result.errors.map(err => `<li>${err}</li>`).join('')}
    </ul>
    ` : ''}
  </div>
</body>
</html>
    `;

    return html;
  }

  private getMetricsMarkdown(metrics: SimulationMetrics): string {
    let md = `## Metrics Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Conversations | ${metrics.totalConversations} |\n`;
    md += `| Average Session Length | ${metrics.averageSessionLength.toFixed(2)} |\n`;
    md += `| Relationship Growth | ${metrics.relationshipGrowth.toFixed(2)}% |\n`;
    md += `| Memory Growth | ${metrics.memoryGrowth.toFixed(2)}% |\n`;
    md += `| Emotional Stability | ${metrics.emotionalStability.toFixed(2)}% |\n`;
    md += `| Trust Evolution | ${metrics.trustEvolution.toFixed(2)}% |\n`;
    md += `| Comfort Evolution | ${metrics.comfortEvolution.toFixed(2)}% |\n`;
    md += `| Context Accuracy | ${metrics.contextAccuracy.toFixed(2)}% |\n`;
    md += `| Moment Accuracy | ${metrics.momentAccuracy.toFixed(2)}% |\n`;
    md += `| Notification Accuracy | ${metrics.notificationAccuracy.toFixed(2)}% |\n`;
    md += `| Retention Rate | ${metrics.retentionRate.toFixed(2)}% |\n`;
    md += `| Engagement Score | ${metrics.engagementScore.toFixed(2)} |\n\n`;

    return md;
  }
}
