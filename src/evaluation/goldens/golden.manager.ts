/**
 * Golden Conversation Manager
 * Manages golden conversations for regression detection
 */

import {
  GoldenConversation,
  EvaluationScenarioType,
  ModelProvider,
  Message,
  WorldState,
  RelationshipState,
  MemoryState,
} from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class GoldenManager {
  private logger = createLogger(this.constructor.name);
  private goldens: Map<string, GoldenConversation> = new Map();

  async createGolden(
    scenarioType: EvaluationScenarioType,
    conversation: Message[],
    worldState: WorldState,
    relationshipState: RelationshipState,
    memoryState: MemoryState,
    expectedResponse: string,
    metadata?: Record<string, any>
  ): Promise<GoldenConversation> {
    try {
      const golden: GoldenConversation = {
        id: uuidv4(),
        scenarioType,
        conversation,
        worldState,
        relationshipState,
        memoryState,
        expectedResponse,
        actualResponses: {},
        scores: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata,
      };

      this.goldens.set(golden.id, golden);
      this.logger.info(`Created golden conversation ${golden.id} for ${scenarioType}`);

      return golden;
    } catch (error) {
      this.logger.error(`Failed to create golden conversation: ${error}`);
      throw error;
    }
  }

  async getGolden(id: string): Promise<GoldenConversation | null> {
    return this.goldens.get(id) || null;
  }

  async getGoldensByScenarioType(
    scenarioType: EvaluationScenarioType
  ): Promise<GoldenConversation[]> {
    const results: GoldenConversation[] = [];
    this.goldens.forEach(golden => {
      if (golden.scenarioType === scenarioType) {
        results.push(golden);
      }
    });
    return results;
  }

  async getAllGoldens(): Promise<GoldenConversation[]> {
    return Array.from(this.goldens.values());
  }

  async updateGoldenResponse(
    id: string,
    modelProvider: ModelProvider,
    response: string,
    score: number
  ): Promise<GoldenConversation> {
    const golden = this.goldens.get(id);
    if (!golden) {
      throw new Error(`Golden conversation not found: ${id}`);
    }

    golden.actualResponses[modelProvider] = response;
    golden.scores[modelProvider] = score;
    golden.updatedAt = new Date();

    this.goldens.set(id, golden);
    this.logger.info(`Updated golden conversation ${id} with ${modelProvider} response`);

    return golden;
  }

  async deleteGolden(id: string): Promise<void> {
    if (!this.goldens.has(id)) {
      throw new Error(`Golden conversation not found: ${id}`);
    }

    this.goldens.delete(id);
    this.logger.info(`Deleted golden conversation ${id}`);
  }

  async compareResponses(
    goldenId: string,
    modelProvider: ModelProvider
  ): Promise<{
    score: number;
    similarity: number;
    issues: string[];
  }> {
    const golden = this.goldens.get(goldenId);
    if (!golden) {
      throw new Error(`Golden conversation not found: ${goldenId}`);
    }

    const actualResponse = golden.actualResponses[modelProvider];
    if (!actualResponse) {
      return {
        score: 0,
        similarity: 0,
        issues: ['No response recorded for this model'],
      };
    }

    const score = golden.scores[modelProvider] || 0;
    const similarity = this.calculateSimilarity(golden.expectedResponse, actualResponse);
    const issues = this.identifyIssues(golden.expectedResponse, actualResponse);

    return { score, similarity, issues };
  }

  async compareAllModels(goldenId: string): Promise<{
    [key in ModelProvider]?: { score: number; similarity: number };
  }> {
    const golden = this.goldens.get(goldenId);
    if (!golden) {
      throw new Error(`Golden conversation not found: ${goldenId}`);
    }

    const comparison: any = {};

    for (const modelProvider of Object.values(ModelProvider)) {
      if (golden.actualResponses[modelProvider as ModelProvider]) {
        const score = golden.scores[modelProvider as ModelProvider] || 0;
        const similarity = this.calculateSimilarity(
          golden.expectedResponse,
          golden.actualResponses[modelProvider as ModelProvider]!
        );
        comparison[modelProvider as ModelProvider] = { score, similarity };
      }
    }

    return comparison;
  }

  async getGoldenStats(): Promise<{
    total: number;
    bySenarioType: Record<EvaluationScenarioType, number>;
    averageScore: number;
    modelsRecorded: ModelProvider[];
  }> {
    const goldens = Array.from(this.goldens.values());

    const bySenarioType: Record<EvaluationScenarioType, number> = {} as any;
    let totalScore = 0;
    let scoreCount = 0;
    const modelsRecorded = new Set<ModelProvider>();

    goldens.forEach(golden => {
      bySenarioType[golden.scenarioType] = (bySenarioType[golden.scenarioType] || 0) + 1;

      Object.entries(golden.scores).forEach(([model, score]) => {
        totalScore += score;
        scoreCount++;
        modelsRecorded.add(model as ModelProvider);
      });
    });

    return {
      total: goldens.length,
      bySenarioType,
      averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
      modelsRecorded: Array.from(modelsRecorded),
    };
  }

  private calculateSimilarity(expected: string, actual: string): number {
    const expectedWords = new Set(expected.toLowerCase().split(/\s+/));
    const actualWords = new Set(actual.toLowerCase().split(/\s+/));

    const intersection = new Set(
      [...expectedWords].filter(w => actualWords.has(w))
    );
    const union = new Set([...expectedWords, ...actualWords]);

    return intersection.size / union.size;
  }

  private identifyIssues(expected: string, actual: string): string[] {
    const issues: string[] = [];

    if (actual.length < expected.length * 0.5) {
      issues.push('Response is significantly shorter than expected');
    }

    if (actual.length > expected.length * 2) {
      issues.push('Response is significantly longer than expected');
    }

    const expectedWords = expected.toLowerCase().split(/\s+/);
    const actualText = actual.toLowerCase();

    const missingKeywords = expectedWords.filter(
      word => word.length > 3 && !actualText.includes(word)
    );

    if (missingKeywords.length > 0) {
      issues.push(`Missing key words: ${missingKeywords.slice(0, 3).join(', ')}`);
    }

    return issues;
  }

  clearAllGoldens(): void {
    this.goldens.clear();
    this.logger.info('Cleared all golden conversations');
  }
}
