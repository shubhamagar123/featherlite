/**
 * Scenario Manager
 * Manages evaluation scenario definitions and CRUD operations
 */

import {
  EvaluationScenario,
  EvaluationScenarioType,
} from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ScenarioManager {
  private logger = createLogger(this.constructor.name);
  private scenarios: Map<string, EvaluationScenario> = new Map();

  async createScenario(
    type: EvaluationScenarioType,
    description: string,
    conversationHistory: any[],
    worldState: any,
    relationshipState: any,
    memoryState: any,
    expectedBehaviour: any,
    expectedMemories: any[],
    expectedTone: string,
    expectedEmotion: string,
    difficulty: 'easy' | 'medium' | 'hard',
    expectedFollowup?: string,
    expectedContext?: string,
    expectedEvents?: string[],
    expectedNotifications?: string[],
    metadata?: Record<string, any>
  ): Promise<EvaluationScenario> {
    try {
      const scenario: EvaluationScenario = {
        id: uuidv4(),
        type,
        description,
        conversationHistory,
        worldState,
        relationshipState,
        memoryState,
        expectedBehaviour,
        expectedMemories,
        expectedTone,
        expectedEmotion,
        expectedFollowup,
        expectedContext,
        expectedEvents,
        expectedNotifications,
        difficulty,
        metadata,
      };

      this.scenarios.set(scenario.id, scenario);
      this.logger.info(`Created scenario ${scenario.id} of type ${type}`);

      return scenario;
    } catch (error) {
      this.logger.error(`Failed to create scenario: ${error}`);
      throw error;
    }
  }

  async getScenario(id: string): Promise<EvaluationScenario | null> {
    return this.scenarios.get(id) || null;
  }

  async getScenariosByType(type: EvaluationScenarioType): Promise<EvaluationScenario[]> {
    const results: EvaluationScenario[] = [];
    this.scenarios.forEach(scenario => {
      if (scenario.type === type) {
        results.push(scenario);
      }
    });
    return results;
  }

  async getScenariosByDifficulty(
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<EvaluationScenario[]> {
    const results: EvaluationScenario[] = [];
    this.scenarios.forEach(scenario => {
      if (scenario.difficulty === difficulty) {
        results.push(scenario);
      }
    });
    return results;
  }

  async getAllScenarios(): Promise<EvaluationScenario[]> {
    return Array.from(this.scenarios.values());
  }

  async updateScenario(
    id: string,
    updates: Partial<EvaluationScenario>
  ): Promise<EvaluationScenario> {
    const scenario = this.scenarios.get(id);
    if (!scenario) {
      throw new Error(`Scenario not found: ${id}`);
    }

    const updated: EvaluationScenario = {
      ...scenario,
      ...updates,
      id: scenario.id,
    };

    this.scenarios.set(id, updated);
    this.logger.info(`Updated scenario ${id}`);

    return updated;
  }

  async deleteScenario(id: string): Promise<void> {
    if (!this.scenarios.has(id)) {
      throw new Error(`Scenario not found: ${id}`);
    }

    this.scenarios.delete(id);
    this.logger.info(`Deleted scenario ${id}`);
  }

  async getScenarioCount(): Promise<number> {
    return this.scenarios.size;
  }

  async getScenarioDistribution(): Promise<Record<EvaluationScenarioType, number>> {
    const distribution: Record<EvaluationScenarioType, number> = {} as any;

    this.scenarios.forEach(scenario => {
      const count = distribution[scenario.type] || 0;
      distribution[scenario.type] = count + 1;
    });

    return distribution;
  }

  async searchScenarios(query: string): Promise<EvaluationScenario[]> {
    const lowerQuery = query.toLowerCase();
    const results: EvaluationScenario[] = [];

    this.scenarios.forEach(scenario => {
      if (
        scenario.description.toLowerCase().includes(lowerQuery) ||
        scenario.expectedTone.toLowerCase().includes(lowerQuery) ||
        scenario.expectedEmotion.toLowerCase().includes(lowerQuery)
      ) {
        results.push(scenario);
      }
    });

    return results;
  }

  async duplicateScenario(sourceId: string, newDescription?: string): Promise<EvaluationScenario> {
    const source = this.scenarios.get(sourceId);
    if (!source) {
      throw new Error(`Source scenario not found: ${sourceId}`);
    }

    return this.createScenario(
      source.type,
      newDescription || source.description,
      JSON.parse(JSON.stringify(source.conversationHistory)),
      JSON.parse(JSON.stringify(source.worldState)),
      JSON.parse(JSON.stringify(source.relationshipState)),
      JSON.parse(JSON.stringify(source.memoryState)),
      JSON.parse(JSON.stringify(source.expectedBehaviour)),
      JSON.parse(JSON.stringify(source.expectedMemories)),
      source.expectedTone,
      source.expectedEmotion,
      source.difficulty,
      source.expectedFollowup,
      source.expectedContext,
      source.expectedEvents,
      source.expectedNotifications,
      source.metadata ? JSON.parse(JSON.stringify(source.metadata)) : undefined
    );
  }

  clearAllScenarios(): void {
    this.scenarios.clear();
    this.logger.info('Cleared all scenarios');
  }
}
