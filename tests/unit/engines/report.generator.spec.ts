import { ReportGenerator } from '@/engines/evaluation/scenarios/report.generator';
import { ScenarioResult, ScenarioDataset, ScenarioDatasetType } from '@/engines/evaluation/scenarios/scenario.types';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  const createTestDataset = (): ScenarioDataset => ({
    name: 'Test Dataset',
    type: ScenarioDatasetType.REGRESSION,
    scenarios: [],
    metadata: {
      createdAt: new Date(),
      totalScenarios: 10,
      categories: {
        MEMORY_RECALL: 3,
        RELATIONSHIP_EVOLUTION: 3,
        EMOTIONAL_INTELLIGENCE: 4,
        CONTEXT_GENERATION: 0,
        PROMPT_QUALITY: 0,
        WORLD_CONSISTENCY: 0,
        CONVERSATION_CONTINUITY: 0,
        MOMENTS_GENERATION: 0,
        NOTIFICATIONS: 0,
        SAFETY: 0,
        HALLUCINATION_DETECTION: 0,
        LONG_TERM_CONSISTENCY: 0,
      },
      priorities: {
        CRITICAL: 2,
        HIGH: 5,
        MEDIUM: 2,
        LOW: 1,
      },
    },
  });

  const createTestResult = (overrides?: Partial<ScenarioResult>): ScenarioResult => ({
    scenarioId: 'scenario-1',
    datasetType: ScenarioDatasetType.REGRESSION,
    executedAt: new Date(),
    duration: 1500,
    success: true,
    actualBehavior: {},
    actualMemories: [],
    actualRelationshipChanges: {},
    actualResponse: 'Test response',
    regressionPassed: true,
    regressionFailures: [],
    errors: [],
    warnings: [],
    actualEvaluation: {
      memoryRecallScore: 0.85,
      relationshipAccuracy: 0.80,
      emotionalIntelligence: 0.75,
      contextRelevance: 0.90,
      promptQuality: 0.88,
      worldConsistency: 0.92,
      conversationContinuity: 0.85,
      momentRelevance: 0.70,
      notificationRelevance: 0.80,
      safetyScore: 0.95,
      hallucination: 0.05,
      consistencyOverTime: 0.85,
      overallScore: 0.83,
    },
    ...overrides,
  });

  describe('generateMarkdownReport', () => {
    it('should handle empty results without throwing', () => {
      const dataset = createTestDataset();
      const results: ScenarioResult[] = [];

      expect(() => {
        generator.generateMarkdownReport(dataset, results);
      }).not.toThrow();
    });

    it('should return message when results are empty', () => {
      const dataset = createTestDataset();
      const results: ScenarioResult[] = [];

      const report = generator.generateMarkdownReport(dataset, results);
      expect(report).toContain('No results available');
    });

    it('should calculate pass rate without division by zero', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ success: true }),
        createTestResult({ success: true }),
        createTestResult({ success: false }),
      ];

      const report = generator.generateMarkdownReport(dataset, results);
      expect(report).toContain('66.67%');
      expect(report).toContain('Pass Rate');
    });

    it('should include dataset name in report', () => {
      const dataset = createTestDataset();
      dataset.name = 'Custom Test Dataset';
      const results = [createTestResult()];

      const report = generator.generateMarkdownReport(dataset, results);
      expect(report).toContain('Custom Test Dataset');
    });

    it('should include execution summary', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ success: true }),
        createTestResult({ success: false }),
      ];

      const report = generator.generateMarkdownReport(dataset, results);
      expect(report).toContain('Execution Summary');
      expect(report).toContain('Total Executions:** 2');
      expect(report).toContain('Passed:** 1');
      expect(report).toContain('Failed:** 1');
    });

    it('should include category distribution', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const report = generator.generateMarkdownReport(dataset, results);
      expect(report).toContain('Category Distribution');
    });

    it('should include priority distribution', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const report = generator.generateMarkdownReport(dataset, results);
      expect(report).toContain('Priority Distribution');
    });

    it('should include regression analysis', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ regressionPassed: true }),
        createTestResult({ regressionPassed: false }),
      ];

      const report = generator.generateMarkdownReport(dataset, results);
      expect(report).toContain('Regression Analysis');
      expect(report).toContain('Regression Tests Passed');
    });

    it('should include execution metrics without NaN', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ duration: 1000 }),
        createTestResult({ duration: 2000 }),
        createTestResult({ duration: 3000 }),
      ];

      const report = generator.generateMarkdownReport(dataset, results);
      expect(report).toContain('Execution Metrics');
      expect(report).toContain('Average Duration');
      expect(report).not.toContain('NaN');
      expect(report).not.toContain('Infinity');
    });

    it('should include evaluation scores summary', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const report = generator.generateMarkdownReport(dataset, results);
      expect(report).toContain('Evaluation Scores Summary');
      expect(report).toContain('memoryRecallScore');
      expect(report).toContain('safetyScore');
    });
  });

  describe('generateJSONReport', () => {
    it('should handle empty results without throwing', () => {
      const dataset = createTestDataset();
      const results: ScenarioResult[] = [];

      expect(() => {
        generator.generateJSONReport(dataset, results);
      }).not.toThrow();
    });

    it('should return valid JSON structure when results are empty', () => {
      const dataset = createTestDataset();
      const results: ScenarioResult[] = [];

      const report = generator.generateJSONReport(dataset, results);
      expect(report).toHaveProperty('metadata');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('results');
      expect(report.summary.executedScenarios).toBe(0);
    });

    it('should include metadata in JSON report', () => {
      const dataset = createTestDataset();
      dataset.name = 'Test Dataset Name';
      const results = [createTestResult()];

      const report = generator.generateJSONReport(dataset, results);
      expect(report.metadata.name).toBe('Test Dataset Name');
      expect(report.metadata.type).toBe(ScenarioDatasetType.REGRESSION);
      expect(report.metadata.generatedAt).toBeDefined();
    });

    it('should calculate summary statistics without division by zero', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ success: true }),
        createTestResult({ success: true }),
        createTestResult({ success: false }),
      ];

      const report = generator.generateJSONReport(dataset, results);
      expect(report.summary.executedScenarios).toBe(3);
      expect(report.summary.passedScenarios).toBe(2);
      expect(report.summary.failedScenarios).toBe(1);
    });

    it('should include all results in JSON report', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ scenarioId: 'scenario-1' }),
        createTestResult({ scenarioId: 'scenario-2' }),
      ];

      const report = generator.generateJSONReport(dataset, results);
      expect(report.results).toHaveLength(2);
      expect(report.results[0].scenarioId).toBe('scenario-1');
      expect(report.results[1].scenarioId).toBe('scenario-2');
    });

    it('should include category metrics in JSON report', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const report = generator.generateJSONReport(dataset, results);
      expect(report).toHaveProperty('categoryMetrics');
    });

    it('should include evaluation metrics in JSON report', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const report = generator.generateJSONReport(dataset, results);
      expect(report).toHaveProperty('evaluationMetrics');
    });
  });

  describe('generateCSVReport - CSV Injection Prevention', () => {
    it('should handle empty results without throwing', () => {
      const dataset = createTestDataset();
      const results: ScenarioResult[] = [];

      expect(() => {
        generator.generateCSVReport(dataset, results);
      }).not.toThrow();
    });

    it('should return message when results are empty', () => {
      const dataset = createTestDataset();
      const results: ScenarioResult[] = [];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('No results available');
    });

    it('should escape formula prefix = in CSV values', () => {
      const dataset = createTestDataset();
      const results = [createTestResult({ scenarioId: '=malicious_formula' })];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('"=malicious_formula"');
      expect(report).not.toContain('=malicious_formula,');
    });

    it('should escape formula prefix + in CSV values', () => {
      const dataset = createTestDataset();
      const results = [createTestResult({ scenarioId: '+formula' })];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('"+formula"');
    });

    it('should escape formula prefix - in CSV values', () => {
      const dataset = createTestDataset();
      const results = [createTestResult({ scenarioId: '-formula' })];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('"-formula"');
    });

    it('should escape formula prefix @ in CSV values', () => {
      const dataset = createTestDataset();
      const results = [createTestResult({ scenarioId: '@formula' })];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('"@formula"');
    });

    it('should escape commas in CSV values', () => {
      const dataset = createTestDataset();
      const results = [createTestResult({ scenarioId: 'scenario,with,commas' })];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('"scenario,with,commas"');
    });

    it('should escape quotes in CSV values', () => {
      const dataset = createTestDataset();
      const results = [createTestResult({ scenarioId: 'scenario"with"quotes' })];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('scenario""with""quotes');
    });

    it('should escape newlines in CSV values', () => {
      const dataset = createTestDataset();
      const results = [createTestResult({ scenarioId: 'scenario\nwith\nnewlines' })];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('"scenario');
    });

    it('should include CSV headers', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('ScenarioId');
      expect(report).toContain('DatasetType');
      expect(report).toContain('Duration');
      expect(report).toContain('Success');
      expect(report).toContain('MemoryScore');
    });

    it('should generate valid CSV format with proper line breaks', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ scenarioId: 'scenario-1', duration: 1000 }),
        createTestResult({ scenarioId: 'scenario-2', duration: 2000 }),
      ];

      const report = generator.generateCSVReport(dataset, results);
      const lines = report.split('\n');

      expect(lines.length).toBeGreaterThan(2);
      expect(lines[0]).toContain('ScenarioId');
    });

    it('should include evaluation scores in CSV', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({
          actualEvaluation: {
            memoryRecallScore: 0.95,
            relationshipAccuracy: 0.88,
            emotionalIntelligence: 0.85,
            contextRelevance: 0.92,
            promptQuality: 0.90,
            worldConsistency: 0.93,
            conversationContinuity: 0.87,
            momentRelevance: 0.75,
            notificationRelevance: 0.82,
            safetyScore: 0.98,
            hallucination: 0.02,
            consistencyOverTime: 0.89,
            overallScore: 0.89,
          },
        }),
      ];

      const report = generator.generateCSVReport(dataset, results);
      expect(report).toContain('0.950');
      expect(report).toContain('0.880');
    });
  });

  describe('generateHTMLReport', () => {
    it('should handle empty results without throwing', () => {
      const dataset = createTestDataset();
      const results: ScenarioResult[] = [];

      expect(() => {
        generator.generateHTMLReport(dataset, results);
      }).not.toThrow();
    });

    it('should return valid HTML when results are empty', () => {
      const dataset = createTestDataset();
      const results: ScenarioResult[] = [];

      const report = generator.generateHTMLReport(dataset, results);
      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('No results available');
    });

    it('should include dataset name in HTML', () => {
      const dataset = createTestDataset();
      dataset.name = 'Custom Test Report';
      const results = [createTestResult()];

      const report = generator.generateHTMLReport(dataset, results);
      expect(report).toContain('Custom Test Report');
    });

    it('should calculate pass rate in HTML without division by zero', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ success: true }),
        createTestResult({ success: false }),
      ];

      const report = generator.generateHTMLReport(dataset, results);
      expect(report).toContain('50.00');
      expect(report).not.toContain('NaN');
      expect(report).not.toContain('Infinity');
    });

    it('should include summary metrics in HTML', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ success: true }),
        createTestResult({ success: false }),
      ];

      const report = generator.generateHTMLReport(dataset, results);
      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('<html>');
      expect(report).toContain('</html>');
    });

    it('should be valid HTML structure', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const report = generator.generateHTMLReport(dataset, results);
      expect(report).toContain('<head>');
      expect(report).toContain('</head>');
      expect(report).toContain('<body>');
      expect(report).toContain('</body>');
      expect(report).toContain('<title>');
      expect(report).toContain('</title>');
    });

    it('should include styling in HTML report', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const report = generator.generateHTMLReport(dataset, results);
      expect(report).toContain('<style>');
      expect(report).toContain('</style>');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle single result without errors', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const markdown = generator.generateMarkdownReport(dataset, results);
      const json = generator.generateJSONReport(dataset, results);
      const csv = generator.generateCSVReport(dataset, results);
      const html = generator.generateHTMLReport(dataset, results);

      expect(markdown).toBeTruthy();
      expect(json).toBeTruthy();
      expect(csv).toBeTruthy();
      expect(html).toBeTruthy();
    });

    it('should handle large number of results', () => {
      const dataset = createTestDataset();
      const results = Array.from({ length: 1000 }, (_, i) =>
        createTestResult({ scenarioId: `scenario-${i}` })
      );

      const markdown = generator.generateMarkdownReport(dataset, results);
      const json = generator.generateJSONReport(dataset, results);
      const csv = generator.generateCSVReport(dataset, results);

      expect(markdown).toContain('Pass Rate');
      expect(json.results.length).toBe(1000);
      expect(csv.split('\n').length).toBeGreaterThan(1000);
    });

    it('should handle mixed success and failure results', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({ success: true, regressionPassed: true }),
        createTestResult({ success: false, regressionPassed: false, errors: [{ message: 'Test error' }] as any[] }),
        createTestResult({ success: true, regressionPassed: false, regressionFailures: ['metric1'] }),
      ];

      const markdown = generator.generateMarkdownReport(dataset, results);
      const json = generator.generateJSONReport(dataset, results);

      expect(markdown).toContain('66.67');
      expect(json.summary.passedScenarios).toBe(2);
      expect(json.summary.failedScenarios).toBe(1);
    });

    it('should handle results with no evaluation data', () => {
      const dataset = createTestDataset();
      const results = [
        createTestResult({
          actualEvaluation: {
            memoryRecallScore: 0,
            relationshipAccuracy: 0,
            emotionalIntelligence: 0,
            contextRelevance: 0,
            promptQuality: 0,
            worldConsistency: 0,
            conversationContinuity: 0,
            momentRelevance: 0,
            notificationRelevance: 0,
            safetyScore: 0,
            hallucination: 0,
            consistencyOverTime: 0,
            overallScore: 0,
          },
        }),
      ];

      const markdown = generator.generateMarkdownReport(dataset, results);
      expect(markdown).toContain('memoryRecallScore');
    });
  });

  describe('Report Consistency', () => {
    it('should produce consistent results for same input', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const json1 = generator.generateJSONReport(dataset, results);
      const json2 = generator.generateJSONReport(dataset, results);

      expect(json1.metadata.name).toBe(json2.metadata.name);
      expect(json1.summary.executedScenarios).toBe(json2.summary.executedScenarios);
    });

    it('should include timestamp in all reports', () => {
      const dataset = createTestDataset();
      const results = [createTestResult()];

      const markdown = generator.generateMarkdownReport(dataset, results);
      const json = generator.generateJSONReport(dataset, results);
      const html = generator.generateHTMLReport(dataset, results);

      expect(json.metadata.generatedAt).toBeDefined();
      expect(markdown).toContain('Generated');
      expect(html).toContain('Generated');
    });
  });
});
