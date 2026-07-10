/**
 * Dataset Generator
 * Generates datasets for different testing scenarios
 */

import {
  EvaluationScenario,
  ScenarioDataset,
  ScenarioDatasetType,
  ScenarioCategory,
} from './scenario.types';
import { ScenarioGenerator } from './scenario.generator';

export class DatasetGenerator {
  private scenarioGenerator: ScenarioGenerator;

  constructor() {
    this.scenarioGenerator = new ScenarioGenerator();
  }

  generateAllDatasets(): ScenarioDataset[] {
    const allScenarios = this.scenarioGenerator.generateAllScenarios();

    const datasets: ScenarioDataset[] = [
      this.generateGoldenDataset(allScenarios),
      this.generateRegressionDataset(allScenarios),
      this.generateStressDataset(allScenarios),
      this.generateLongTermDataset(allScenarios),
      this.generateEdgeCaseDataset(allScenarios),
      this.generateFailureCaseDataset(allScenarios),
    ];

    return datasets;
  }

  private generateGoldenDataset(allScenarios: EvaluationScenario[]): ScenarioDataset {
    const filtered = allScenarios.filter(
      s => s.priority === 'CRITICAL' || s.priority === 'HIGH'
    );

    return {
      name: 'Golden Dataset',
      type: ScenarioDatasetType.GOLDEN,
      scenarios: filtered.slice(0, Math.min(50, filtered.length)),
      metadata: {
        createdAt: new Date(),
        totalScenarios: Math.min(50, filtered.length),
        categories: this.calculateCategoryDistribution(filtered),
        priorities: this.calculatePriorityDistribution(filtered),
      },
    };
  }

  private generateRegressionDataset(allScenarios: EvaluationScenario[]): ScenarioDataset {
    const filtered = allScenarios.filter(
      s =>
        s.datasetType === ScenarioDatasetType.REGRESSION ||
        s.priority !== 'LOW'
    );

    return {
      name: 'Regression Dataset',
      type: ScenarioDatasetType.REGRESSION,
      scenarios: filtered.slice(0, Math.min(150, filtered.length)),
      metadata: {
        createdAt: new Date(),
        totalScenarios: Math.min(150, filtered.length),
        categories: this.calculateCategoryDistribution(filtered),
        priorities: this.calculatePriorityDistribution(filtered),
      },
    };
  }

  private generateStressDataset(allScenarios: EvaluationScenario[]): ScenarioDataset {
    const highVolume = this.duplicateScenarios(allScenarios, 3);
    const complexScenarios = allScenarios.filter(
      s => s.conversationHistory.length > 2
    );

    const scenarios = [...highVolume, ...complexScenarios].slice(0, 300);

    return {
      name: 'Stress Dataset',
      type: ScenarioDatasetType.STRESS,
      scenarios,
      metadata: {
        createdAt: new Date(),
        totalScenarios: scenarios.length,
        categories: this.calculateCategoryDistribution(scenarios),
        priorities: this.calculatePriorityDistribution(scenarios),
      },
    };
  }

  private generateLongTermDataset(allScenarios: EvaluationScenario[]): ScenarioDataset {
    const filtered = allScenarios.filter(
      s =>
        s.category === ScenarioCategory.LONG_TERM_CONSISTENCY ||
        s.category === ScenarioCategory.CONVERSATION_CONTINUITY ||
        s.category === ScenarioCategory.RELATIONSHIP_EVOLUTION
    );

    return {
      name: 'Long-Term Simulation Dataset',
      type: ScenarioDatasetType.LONG_TERM,
      scenarios: filtered.slice(0, Math.min(100, filtered.length)),
      metadata: {
        createdAt: new Date(),
        totalScenarios: Math.min(100, filtered.length),
        categories: this.calculateCategoryDistribution(filtered),
        priorities: this.calculatePriorityDistribution(filtered),
      },
    };
  }

  private generateEdgeCaseDataset(allScenarios: EvaluationScenario[]): ScenarioDataset {
    const filtered = allScenarios.filter(s => s.tags.includes('EDGE_CASE'));

    return {
      name: 'Edge Case Dataset',
      type: ScenarioDatasetType.EDGE_CASE,
      scenarios: filtered.slice(0, Math.min(80, filtered.length)),
      metadata: {
        createdAt: new Date(),
        totalScenarios: Math.min(80, filtered.length),
        categories: this.calculateCategoryDistribution(filtered),
        priorities: this.calculatePriorityDistribution(filtered),
      },
    };
  }

  private generateFailureCaseDataset(allScenarios: EvaluationScenario[]): ScenarioDataset {
    const modified = allScenarios
      .filter(s => s.category === ScenarioCategory.SAFETY || s.category === ScenarioCategory.HALLUCINATION_DETECTION)
      .map(s => ({
        ...s,
        expectedEvaluation: {
          ...s.expectedEvaluation,
          safetyScore: Math.min(0.5, s.expectedEvaluation.safetyScore),
          hallucination: Math.max(0.5, s.expectedEvaluation.hallucination),
        },
      }));

    return {
      name: 'Failure Case Dataset',
      type: ScenarioDatasetType.FAILURE_CASE,
      scenarios: modified.slice(0, Math.min(70, modified.length)),
      metadata: {
        createdAt: new Date(),
        totalScenarios: Math.min(70, modified.length),
        categories: this.calculateCategoryDistribution(modified),
        priorities: this.calculatePriorityDistribution(modified),
      },
    };
  }

  private duplicateScenarios(scenarios: EvaluationScenario[], times: number): EvaluationScenario[] {
    const duplicated: EvaluationScenario[] = [];

    for (let i = 0; i < times; i++) {
      for (const scenario of scenarios) {
        duplicated.push({
          ...scenario,
          id: `${scenario.id}-dup-${i}`,
          expectedEvaluation: { ...scenario.expectedEvaluation },
          expectedBehavior: { ...scenario.expectedBehavior },
          expectedRelationshipChanges: { ...scenario.expectedRelationshipChanges },
          expectedPromptCharacteristics: { ...scenario.expectedPromptCharacteristics },
          expectedResponseCharacteristics: { ...scenario.expectedResponseCharacteristics },
          regressionThresholds: { ...scenario.regressionThresholds },
          conversationHistory: [...scenario.conversationHistory],
          tags: [...scenario.tags],
          expectedMemories: [...scenario.expectedMemories],
          expectedEvents: [...scenario.expectedEvents],
          expectedMoments: [...scenario.expectedMoments],
          expectedNotifications: [...scenario.expectedNotifications],
        });
      }
    }

    return duplicated;
  }

  private calculateCategoryDistribution(
    scenarios: EvaluationScenario[]
  ): Record<ScenarioCategory, number> {
    const distribution: Record<ScenarioCategory, number> = {} as Record<
      ScenarioCategory,
      number
    >;

    for (const category of Object.values(ScenarioCategory)) {
      distribution[category] = scenarios.filter(s => s.category === category).length;
    }

    return distribution;
  }

  private calculatePriorityDistribution(
    scenarios: EvaluationScenario[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    for (const scenario of scenarios) {
      distribution[scenario.priority]++;
    }

    return distribution;
  }
}
