import { DatasetGenerator } from '@/engines/evaluation/scenarios/dataset.generator';
import { ScenarioDatasetType } from '@/engines/evaluation/scenarios/scenario.types';

describe('DatasetGenerator', () => {
  let generator: DatasetGenerator;

  beforeEach(() => {
    generator = new DatasetGenerator();
  });

  describe('generateAllDatasets', () => {
    it('should generate exactly 6 datasets', () => {
      const datasets = generator.generateAllDatasets();

      expect(datasets).toHaveLength(6);
    });

    it('should generate golden dataset', () => {
      const datasets = generator.generateAllDatasets();
      const golden = datasets.find(d => d.type === ScenarioDatasetType.GOLDEN);

      expect(golden).toBeDefined();
      expect(golden!.name).toBe('Golden Dataset');
    });

    it('should generate regression dataset', () => {
      const datasets = generator.generateAllDatasets();
      const regression = datasets.find(d => d.type === ScenarioDatasetType.REGRESSION);

      expect(regression).toBeDefined();
      expect(regression!.name).toBe('Regression Dataset');
    });

    it('should generate stress dataset', () => {
      const datasets = generator.generateAllDatasets();
      const stress = datasets.find(d => d.type === ScenarioDatasetType.STRESS);

      expect(stress).toBeDefined();
      expect(stress!.name).toBe('Stress Dataset');
    });

    it('should generate long-term dataset', () => {
      const datasets = generator.generateAllDatasets();
      const longTerm = datasets.find(d => d.type === ScenarioDatasetType.LONG_TERM);

      expect(longTerm).toBeDefined();
      expect(longTerm!.name).toBe('Long-Term Simulation Dataset');
    });

    it('should generate edge case dataset', () => {
      const datasets = generator.generateAllDatasets();
      const edgeCase = datasets.find(d => d.type === ScenarioDatasetType.EDGE_CASE);

      expect(edgeCase).toBeDefined();
      expect(edgeCase!.name).toBe('Edge Case Dataset');
    });

    it('should generate failure case dataset', () => {
      const datasets = generator.generateAllDatasets();
      const failureCase = datasets.find(d => d.type === ScenarioDatasetType.FAILURE_CASE);

      expect(failureCase).toBeDefined();
      expect(failureCase!.name).toBe('Failure Case Dataset');
    });

    it('should include metadata for each dataset', () => {
      const datasets = generator.generateAllDatasets();

      for (const dataset of datasets) {
        expect(dataset.metadata).toBeDefined();
        expect(dataset.metadata.createdAt).toBeDefined();
        expect(dataset.metadata.totalScenarios).toBeGreaterThanOrEqual(0);
        expect(dataset.metadata.categories).toBeDefined();
        expect(dataset.metadata.priorities).toBeDefined();
      }
    });

    it('should generate total of 610+ scenarios across all datasets', () => {
      const datasets = generator.generateAllDatasets();
      const totalScenarios = datasets.reduce((sum, d) => sum + d.scenarios.length, 0);

      expect(totalScenarios).toBeGreaterThanOrEqual(610);
    });
  });

  describe('Test Isolation - Deep Copy Prevention', () => {
    it('should prevent cross-contamination of duplicated scenarios in stress dataset', () => {
      const datasets = generator.generateAllDatasets();
      const stressDataset = datasets.find(d => d.type === ScenarioDatasetType.STRESS)!;

      const scenarios = stressDataset.scenarios;

      if (scenarios.length > 1) {
        const scenario1 = scenarios[0];
        const scenario2 = scenarios[1];

        scenario1.expectedEvaluation.memoryRecallScore = 0.50;
        const scenario2MemoryScore = scenario2.expectedEvaluation.memoryRecallScore;

        expect(scenario2MemoryScore).not.toBe(0.50);
      }
    });

    it('should prevent contamination through conversationHistory', () => {
      const datasets = generator.generateAllDatasets();
      const stressDataset = datasets.find(d => d.type === ScenarioDatasetType.STRESS)!;

      const scenarios = stressDataset.scenarios;

      if (scenarios.length > 1) {
        const scenario1 = scenarios[0];
        const scenario2 = scenarios[1];

        const originalLength = scenario2.conversationHistory.length;
        scenario1.conversationHistory.push({
          role: 'COMPANION',
          content: 'New message',
          timestamp: new Date(),
        });

        expect(scenario2.conversationHistory).toHaveLength(originalLength);
      }
    });

    it('should prevent contamination through tags array', () => {
      const datasets = generator.generateAllDatasets();
      const stressDataset = datasets.find(d => d.type === ScenarioDatasetType.STRESS)!;

      const scenarios = stressDataset.scenarios;

      if (scenarios.length > 1) {
        const scenario1 = scenarios[0];
        const scenario2 = scenarios[1];

        const originalTags = scenario2.tags.length;
        scenario1.tags.push('NEW_TAG');

        expect(scenario2.tags).toHaveLength(originalTags);
      }
    });

    it('should prevent contamination through expectedMemories', () => {
      const datasets = generator.generateAllDatasets();
      const stressDataset = datasets.find(d => d.type === ScenarioDatasetType.STRESS)!;

      const scenarios = stressDataset.scenarios;

      if (scenarios.length > 1) {
        const scenario1 = scenarios[0];
        const scenario2 = scenarios[1];

        const originalLength = scenario2.expectedMemories.length;
        scenario1.expectedMemories.push('New memory');

        expect(scenario2.expectedMemories).toHaveLength(originalLength);
      }
    });

    it('should prevent contamination through expectedEvents', () => {
      const datasets = generator.generateAllDatasets();
      const stressDataset = datasets.find(d => d.type === ScenarioDatasetType.STRESS)!;

      const scenarios = stressDataset.scenarios;

      if (scenarios.length > 1) {
        const scenario1 = scenarios[0];
        const scenario2 = scenarios[1];

        const originalLength = scenario2.expectedEvents.length;
        scenario1.expectedEvents.push('NEW_EVENT');

        expect(scenario2.expectedEvents).toHaveLength(originalLength);
      }
    });

    it('should prevent contamination through nested objects', () => {
      const datasets = generator.generateAllDatasets();
      const stressDataset = datasets.find(d => d.type === ScenarioDatasetType.STRESS)!;

      const scenarios = stressDataset.scenarios;

      if (scenarios.length > 1) {
        const scenario1 = scenarios[0];
        const scenario2 = scenarios[1];

        const originalResponseType = scenario2.expectedBehavior.responseType;
        scenario1.expectedBehavior.responseType = `${originalResponseType}-mutated`;

        expect(scenario2.expectedBehavior.responseType).toBe(originalResponseType);
      }
    });

    it('should ensure duplicated scenarios have unique IDs', () => {
      const datasets = generator.generateAllDatasets();
      const stressDataset = datasets.find(d => d.type === ScenarioDatasetType.STRESS)!;

      const scenarioIds = new Set(stressDataset.scenarios.map(s => s.id));
      const uniqueIds = stressDataset.scenarios.length;

      expect(scenarioIds.size).toBe(uniqueIds);
    });
  });

  describe('Dataset Size Constraints', () => {
    it('should limit golden dataset to 50 scenarios', () => {
      const datasets = generator.generateAllDatasets();
      const golden = datasets.find(d => d.type === ScenarioDatasetType.GOLDEN)!;

      expect(golden.scenarios.length).toBeLessThanOrEqual(50);
    });

    it('should limit regression dataset to 150 scenarios', () => {
      const datasets = generator.generateAllDatasets();
      const regression = datasets.find(d => d.type === ScenarioDatasetType.REGRESSION)!;

      expect(regression.scenarios.length).toBeLessThanOrEqual(150);
    });

    it('should limit stress dataset to 300 scenarios', () => {
      const datasets = generator.generateAllDatasets();
      const stress = datasets.find(d => d.type === ScenarioDatasetType.STRESS)!;

      expect(stress.scenarios.length).toBeLessThanOrEqual(300);
    });

    it('should limit long-term dataset to 100 scenarios', () => {
      const datasets = generator.generateAllDatasets();
      const longTerm = datasets.find(d => d.type === ScenarioDatasetType.LONG_TERM)!;

      expect(longTerm.scenarios.length).toBeLessThanOrEqual(100);
    });

    it('should limit edge case dataset to 80 scenarios', () => {
      const datasets = generator.generateAllDatasets();
      const edgeCase = datasets.find(d => d.type === ScenarioDatasetType.EDGE_CASE)!;

      expect(edgeCase.scenarios.length).toBeLessThanOrEqual(80);
    });

    it('should limit failure case dataset to 70 scenarios', () => {
      const datasets = generator.generateAllDatasets();
      const failureCase = datasets.find(d => d.type === ScenarioDatasetType.FAILURE_CASE)!;

      expect(failureCase.scenarios.length).toBeLessThanOrEqual(70);
    });
  });

  describe('Failure Case Dataset - Score Modifications', () => {
    it('should reduce safety scores in failure case dataset', () => {
      const datasets = generator.generateAllDatasets();
      const failureCase = datasets.find(d => d.type === ScenarioDatasetType.FAILURE_CASE)!;

      for (const scenario of failureCase.scenarios) {
        if (scenario.expectedEvaluation.safetyScore > 0) {
          expect(scenario.expectedEvaluation.safetyScore).toBeLessThanOrEqual(0.5);
        }
      }
    });

    it('should increase hallucination scores in failure case dataset', () => {
      const datasets = generator.generateAllDatasets();
      const failureCase = datasets.find(d => d.type === ScenarioDatasetType.FAILURE_CASE)!;

      for (const scenario of failureCase.scenarios) {
        if (scenario.expectedEvaluation.hallucination > 0) {
          expect(scenario.expectedEvaluation.hallucination).toBeGreaterThanOrEqual(0.5);
        }
      }
    });
  });

  describe('Metadata Accuracy', () => {
    it('should calculate correct total scenarios in metadata', () => {
      const datasets = generator.generateAllDatasets();

      for (const dataset of datasets) {
        expect(dataset.metadata.totalScenarios).toBe(dataset.scenarios.length);
      }
    });

    it('should include all scenario priorities in metadata', () => {
      const datasets = generator.generateAllDatasets();

      for (const dataset of datasets) {
        const expectedPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        for (const priority of expectedPriorities) {
          expect(dataset.metadata.priorities).toHaveProperty(priority);
        }
      }
    });

    it('should include all scenario categories in metadata', () => {
      const datasets = generator.generateAllDatasets();

      for (const dataset of datasets) {
        expect(Object.keys(dataset.metadata.categories).length).toBeGreaterThan(0);
      }
    });

    it('should have valid createdAt timestamp in metadata', () => {
      const datasets = generator.generateAllDatasets();

      for (const dataset of datasets) {
        expect(dataset.metadata.createdAt).toBeInstanceOf(Date);
        expect(dataset.metadata.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });
  });
});
