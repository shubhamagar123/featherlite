/**
 * Dataset Manager
 * Manages evaluation dataset CRUD operations and versioning
 */

import {
  EvaluationDataset,
  EvaluationDatasetType,
  EvaluationScenario,
  EvaluationScenarioType,
} from '../types';
import { createLogger } from '@utils/logger';
import { DatasetLoader } from './dataset.loader';
import { v4 as uuidv4 } from 'uuid';

export class DatasetManager {
  private logger = createLogger(this.constructor.name);
  private loader: DatasetLoader;
  private datasets: Map<string, EvaluationDataset> = new Map();

  constructor() {
    this.loader = new DatasetLoader();
  }

  async createDataset(
    type: EvaluationDatasetType,
    name: string,
    description: string,
    version: string = '1.0.0'
  ): Promise<EvaluationDataset> {
    try {
      const scenarios = await this.loader.loadScenarios(type);

      const dataset: EvaluationDataset = {
        id: uuidv4(),
        type,
        name,
        description,
        scenarios,
        createdAt: new Date(),
        updatedAt: new Date(),
        version,
      };

      this.datasets.set(dataset.id, dataset);
      this.logger.info(
        `Created dataset ${name} (${type}) with ${scenarios.length} scenarios`
      );

      return dataset;
    } catch (error) {
      this.logger.error(`Failed to create dataset: ${error}`);
      throw error;
    }
  }

  async getDataset(id: string): Promise<EvaluationDataset | null> {
    return this.datasets.get(id) || null;
  }

  async getDatasetByType(type: EvaluationDatasetType): Promise<EvaluationDataset[]> {
    const datasets: EvaluationDataset[] = [];
    this.datasets.forEach(dataset => {
      if (dataset.type === type) {
        datasets.push(dataset);
      }
    });
    return datasets;
  }

  async getAllDatasets(): Promise<EvaluationDataset[]> {
    return Array.from(this.datasets.values());
  }

  async updateDataset(
    id: string,
    updates: Partial<EvaluationDataset>
  ): Promise<EvaluationDataset> {
    const dataset = this.datasets.get(id);
    if (!dataset) {
      throw new Error(`Dataset not found: ${id}`);
    }

    const updated: EvaluationDataset = {
      ...dataset,
      ...updates,
      id: dataset.id,
      createdAt: dataset.createdAt,
      updatedAt: new Date(),
    };

    this.datasets.set(id, updated);
    this.logger.info(`Updated dataset ${id}`);

    return updated;
  }

  async deleteDataset(id: string): Promise<void> {
    if (!this.datasets.has(id)) {
      throw new Error(`Dataset not found: ${id}`);
    }

    this.datasets.delete(id);
    this.logger.info(`Deleted dataset ${id}`);
  }

  async addScenario(datasetId: string, scenario: EvaluationScenario): Promise<void> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    dataset.scenarios.push(scenario);
    dataset.updatedAt = new Date();
    this.datasets.set(datasetId, dataset);
    this.logger.info(`Added scenario to dataset ${datasetId}`);
  }

  async removeScenario(datasetId: string, scenarioId: string): Promise<void> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    const index = dataset.scenarios.findIndex(s => s.id === scenarioId);
    if (index === -1) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    dataset.scenarios.splice(index, 1);
    dataset.updatedAt = new Date();
    this.datasets.set(datasetId, dataset);
    this.logger.info(`Removed scenario from dataset ${datasetId}`);
  }

  async getScenario(datasetId: string, scenarioId: string): Promise<EvaluationScenario | null> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) {
      return null;
    }

    return dataset.scenarios.find(s => s.id === scenarioId) || null;
  }

  async getScenariosByType(
    datasetId: string,
    scenarioType: EvaluationScenarioType
  ): Promise<EvaluationScenario[]> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) {
      return [];
    }

    return dataset.scenarios.filter(s => s.type === scenarioType);
  }

  async getScenariosByDifficulty(
    datasetId: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<EvaluationScenario[]> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) {
      return [];
    }

    return dataset.scenarios.filter(s => s.difficulty === difficulty);
  }

  async bumpVersion(datasetId: string): Promise<string> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    const parts = dataset.version.split('.');
    const patch = parseInt(parts[2] || '0', 10) + 1;
    const newVersion = `${parts[0]}.${parts[1]}.${patch}`;

    dataset.version = newVersion;
    dataset.updatedAt = new Date();
    this.datasets.set(datasetId, dataset);
    this.logger.info(`Bumped dataset ${datasetId} version to ${newVersion}`);

    return newVersion;
  }

  async getDatasetStats(datasetId: string): Promise<{
    totalScenarios: number;
    easyScenarios: number;
    mediumScenarios: number;
    hardScenarios: number;
    scenarioTypeDistribution: Record<EvaluationScenarioType, number>;
  }> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    const stats = {
      totalScenarios: dataset.scenarios.length,
      easyScenarios: 0,
      mediumScenarios: 0,
      hardScenarios: 0,
      scenarioTypeDistribution: {} as Record<EvaluationScenarioType, number>,
    };

    dataset.scenarios.forEach(scenario => {
      if (scenario.difficulty === 'easy') stats.easyScenarios++;
      else if (scenario.difficulty === 'medium') stats.mediumScenarios++;
      else if (scenario.difficulty === 'hard') stats.hardScenarios++;

      const count = stats.scenarioTypeDistribution[scenario.type] || 0;
      stats.scenarioTypeDistribution[scenario.type] = count + 1;
    });

    return stats;
  }
}
