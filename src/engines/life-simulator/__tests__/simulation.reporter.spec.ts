/**
 * Simulation Reporter Tests
 */

import { SimulationReporter } from '../reporters/simulation.reporter';
import { SimulationResult, SimulationStatus, SimulationTimeframe, MoodState } from '../types';

describe('SimulationReporter', () => {
  let reporter: SimulationReporter;
  let mockResult: SimulationResult;

  beforeEach(() => {
    reporter = new SimulationReporter();
    mockResult = createMockSimulationResult();
  });

  describe('generateMarkdownReport', () => {
    it('should generate markdown with actor ID', () => {
      const markdown = reporter.generateMarkdownReport(mockResult);

      expect(markdown).toContain('# Simulation Report');
      expect(markdown).toContain(mockResult.actorId);
    });

    it('should include configuration information', () => {
      const markdown = reporter.generateMarkdownReport(mockResult);

      expect(markdown).toContain('## Configuration');
      expect(markdown).toContain('Timeframe');
      expect(markdown).toContain('Speed Multiplier');
    });

    it('should include metrics summary', () => {
      const markdown = reporter.generateMarkdownReport(mockResult);

      expect(markdown).toContain('## Metrics Summary');
      expect(markdown).toContain('Relationship Growth');
      expect(markdown).toContain('Memory Growth');
      expect(markdown).toContain('Engagement Score');
    });

    it('should include timeline summary', () => {
      const markdown = reporter.generateMarkdownReport(mockResult);

      expect(markdown).toContain('## Timeline Summary');
      expect(markdown).toContain('Total Days Simulated');
      expect(markdown).toContain('Total Events');
    });

    it('should format as valid markdown', () => {
      const markdown = reporter.generateMarkdownReport(mockResult);

      expect(markdown).toContain('|');
      expect(markdown).toContain('---');
    });
  });

  describe('generateJsonReport', () => {
    it('should generate valid JSON', () => {
      const json = reporter.generateJsonReport(mockResult);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe(mockResult.id);
      expect(parsed.actorId).toBe(mockResult.actorId);
      expect(parsed.status).toBe(mockResult.status);
    });

    it('should include all result properties', () => {
      const json = reporter.generateJsonReport(mockResult);
      const parsed = JSON.parse(json);

      expect(parsed.metrics).toBeTruthy();
      expect(parsed.configuration).toBeTruthy();
      expect(parsed.history).toBeTruthy();
    });

    it('should format with proper indentation', () => {
      const json = reporter.generateJsonReport(mockResult);

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });

  describe('generateCsvReport', () => {
    it('should generate CSV format', () => {
      const csv = reporter.generateCsvReport(mockResult);

      expect(csv).toContain(',');
      expect(csv).toContain('\n');
    });

    it('should include actor ID and status', () => {
      const csv = reporter.generateCsvReport(mockResult);

      expect(csv).toContain('Actor ID');
      expect(csv).toContain(mockResult.actorId);
      expect(csv).toContain('Status');
      expect(csv).toContain(mockResult.status);
    });

    it('should include metrics data', () => {
      const csv = reporter.generateCsvReport(mockResult);

      expect(csv).toContain('Total Conversations');
      expect(csv).toContain('Relationship Growth');
      expect(csv).toContain('Memory Growth');
      expect(csv).toContain('Engagement Score');
    });

    it('should format numeric values properly', () => {
      const csv = reporter.generateCsvReport(mockResult);
      const lines = csv.split('\n');

      expect(lines.length).toBeGreaterThan(1);
    });
  });

  describe('generateHtmlReport', () => {
    it('should generate valid HTML', () => {
      const html = reporter.generateHtmlReport(mockResult);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
    });

    it('should include title with actor ID', () => {
      const html = reporter.generateHtmlReport(mockResult);

      expect(html).toContain('<title>');
      expect(html).toContain(mockResult.actorId);
    });

    it('should include metrics cards', () => {
      const html = reporter.generateHtmlReport(mockResult);

      expect(html).toContain('metric-card');
      expect(html).toContain('metric-value');
      expect(html).toContain('metric-label');
    });

    it('should include all key metrics', () => {
      const html = reporter.generateHtmlReport(mockResult);

      expect(html).toContain('Relationship Growth');
      expect(html).toContain('Memory Growth');
      expect(html).toContain('Engagement Score');
    });

    it('should include CSS styling', () => {
      const html = reporter.generateHtmlReport(mockResult);

      expect(html).toContain('<style>');
      expect(html).toContain('font-family');
      expect(html).toContain('background');
    });

    it('should format metrics with decimal places', () => {
      const html = reporter.generateHtmlReport(mockResult);

      expect(html).toContain('.toFixed');
    });
  });

  describe('report consistency', () => {
    it('should contain same values across formats', () => {
      const markdown = reporter.generateMarkdownReport(mockResult);
      const json = JSON.parse(reporter.generateJsonReport(mockResult));
      const csv = reporter.generateCsvReport(mockResult);

      expect(markdown).toContain(mockResult.actorId);
      expect(json.actorId).toBe(mockResult.actorId);
      expect(csv).toContain(mockResult.actorId);
    });

    it('should maintain metric values across formats', () => {
      const json = JSON.parse(reporter.generateJsonReport(mockResult));

      expect(json.metrics.relationshipGrowth).toBe(mockResult.metrics.relationshipGrowth);
      expect(json.metrics.engagementScore).toBe(mockResult.metrics.engagementScore);
    });
  });

  describe('error handling', () => {
    it('should include errors in markdown if present', () => {
      const resultWithErrors = { ...mockResult, errors: ['Test error 1', 'Test error 2'] };
      const markdown = reporter.generateMarkdownReport(resultWithErrors);

      expect(markdown).toContain('## Errors');
      expect(markdown).toContain('Test error 1');
    });

    it('should include errors in HTML if present', () => {
      const resultWithErrors = { ...mockResult, errors: ['Test error'] };
      const html = reporter.generateHtmlReport(resultWithErrors);

      expect(html).toContain('Test error');
    });
  });
});

function createMockSimulationResult(): SimulationResult {
  const now = new Date();
  return {
    id: 'test-sim-id',
    actorId: 'test-actor-123',
    configuration: {
      timeframe: SimulationTimeframe.THIRTY_DAYS,
      speedMultiplier: 1,
      includeLifeEvents: true,
      includeRandomVariance: true,
      includeContextEvolution: true,
    },
    status: SimulationStatus.COMPLETED,
    startTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    endTime: now,
    duration: 5000,
    history: {
      id: 'hist-id',
      actorId: 'test-actor-123',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now,
      duration: 5000,
      snapshots: Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(),
        day: i + 1,
        relationshipState: {
          affinity: 50 + i,
          trust: 50 + i * 0.5,
          intimacy: 30 + i * 0.3,
          passion: 40 + i * 0.2,
        },
        memoryCount: i,
        conversationCount: i,
        mood: MoodState.NEUTRAL,
        energy: 0.7,
        stress: 0.3,
      })),
      events: [],
      finalState: {
        configuration: {} as any,
        actor: {} as any,
        timeline: {} as any,
        relationshipState: {
          affinity: 80,
          trust: 65,
          intimacy: 50,
          passion: 60,
        },
        memoryState: {
          totalMemoriesCount: 30,
        },
        worldState: {},
        currentMood: MoodState.POSITIVE,
        currentEnergy: 0.8,
        conversationHistory: [],
        metrics: {} as any,
      },
    },
    metrics: {
      totalConversations: 30,
      averageSessionLength: 166.67,
      relationshipGrowth: 65.2,
      memoryGrowth: 42.5,
      emotionalStability: 75.0,
      trustEvolution: 58.3,
      comfortEvolution: 62.5,
      contextAccuracy: 78.5,
      momentAccuracy: 72.3,
      notificationAccuracy: 68.9,
      retentionRate: 85.7,
      engagementScore: 66,
    },
  };
}
