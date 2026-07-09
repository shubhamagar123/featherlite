/**
 * Metrics Calculator
 * Calculates evaluation metrics from judge results
 */

import {
  EvaluationResult,
  EvaluationScenario,
  MetricResult,
  ReportMetrics,
  JudgeType,
} from '../types';
import { createLogger } from '@utils/logger';

export class MetricsCalculator {
  private logger = createLogger(this.constructor.name);

  calculateMetrics(results: EvaluationResult[]): ReportMetrics {
    if (results.length === 0) {
      return this.getEmptyMetrics();
    }

    try {
      return {
        memoryRecallRate: this.calculateMemoryRecallRate(results),
        memoryPrecisionRate: this.calculateMemoryPrecisionRate(results),
        relationshipConsistency: this.calculateRelationshipConsistency(results),
        promptQuality: this.calculatePromptQuality(results),
        contextQuality: this.calculateContextQuality(results),
        averageLatency: this.calculateAverageLatency(results),
        totalTokenUsage: this.calculateTotalTokenUsage(results),
        estimatedCost: this.calculateEstimatedCost(results),
        hallucinationRate: this.calculateHallucinationRate(results),
        empathyScore: this.calculateEmpathyScore(results),
        humourScore: this.calculateHumourScore(results),
        personalityConsistency: this.calculatePersonalityConsistency(results),
        conversationContinuity: this.calculateConversationContinuity(results),
      };
    } catch (error) {
      this.logger.error(`Failed to calculate metrics: ${error}`);
      return this.getEmptyMetrics();
    }
  }

  calculateMetric(
    results: EvaluationResult[],
    name: string,
    thresholdPercentage: number = 80
  ): MetricResult {
    const value = this.getMetricValue(results, name);
    const passed = value >= thresholdPercentage;

    return {
      name,
      value,
      unit: '%',
      threshold: thresholdPercentage,
      passed,
    };
  }

  private getMetricValue(results: EvaluationResult[], name: string): number {
    const lowerName = name.toLowerCase().replace(/\s+/g, '_');

    switch (lowerName) {
      case 'memory_recall_rate':
        return this.calculateMemoryRecallRate(results);
      case 'memory_precision_rate':
        return this.calculateMemoryPrecisionRate(results);
      case 'relationship_consistency':
        return this.calculateRelationshipConsistency(results);
      case 'prompt_quality':
        return this.calculatePromptQuality(results);
      case 'context_quality':
        return this.calculateContextQuality(results);
      case 'hallucination_rate':
        return 100 - this.calculateHallucinationRate(results);
      case 'empathy_score':
        return this.calculateEmpathyScore(results);
      case 'humour_score':
        return this.calculateHumourScore(results);
      case 'personality_consistency':
        return this.calculatePersonalityConsistency(results);
      case 'conversation_continuity':
        return this.calculateConversationContinuity(results);
      default:
        return 0;
    }
  }

  private calculateMemoryRecallRate(results: EvaluationResult[]): number {
    const memoryJudges = results
      .flatMap(r => r.judges)
      .filter(j => j.judgeType === JudgeType.MEMORY);

    if (memoryJudges.length === 0) {
      return 0;
    }

    const sum = memoryJudges.reduce((acc, j) => acc + j.score, 0);
    return Math.round(sum / memoryJudges.length);
  }

  private calculateMemoryPrecisionRate(results: EvaluationResult[]): number {
    const memoryJudges = results
      .flatMap(r => r.judges)
      .filter(j => j.judgeType === JudgeType.MEMORY);

    if (memoryJudges.length === 0) {
      return 0;
    }

    const accurate = memoryJudges.filter(j => j.passed).length;
    return Math.round((accurate / memoryJudges.length) * 100);
  }

  private calculateRelationshipConsistency(results: EvaluationResult[]): number {
    const relationshipJudges = results
      .flatMap(r => r.judges)
      .filter(j => j.judgeType === JudgeType.RELATIONSHIP);

    if (relationshipJudges.length === 0) {
      return 0;
    }

    const sum = relationshipJudges.reduce((acc, j) => acc + j.score, 0);
    return Math.round(sum / relationshipJudges.length);
  }

  private calculatePromptQuality(results: EvaluationResult[]): number {
    const average = results.reduce((acc, r) => acc + r.score, 0) / results.length;
    return Math.round(average);
  }

  private calculateContextQuality(results: EvaluationResult[]): number {
    const contextJudges = results
      .flatMap(r => r.judges)
      .filter(j => j.judgeType === JudgeType.CONTEXT);

    if (contextJudges.length === 0) {
      return 0;
    }

    const sum = contextJudges.reduce((acc, j) => acc + j.score, 0);
    return Math.round(sum / contextJudges.length);
  }

  private calculateAverageLatency(results: EvaluationResult[]): number {
    if (results.length === 0) {
      return 0;
    }

    const sum = results.reduce((acc, r) => acc + r.duration, 0);
    return Math.round(sum / results.length);
  }

  private calculateTotalTokenUsage(results: EvaluationResult[]): number {
    return results.reduce((acc, r) => {
      const tokens = r.actualResponse.split(/\s+/).length * 1.3;
      return acc + Math.ceil(tokens);
    }, 0);
  }

  private calculateEstimatedCost(results: EvaluationResult[]): number {
    const totalTokens = this.calculateTotalTokenUsage(results);
    const costPerMillion = 0.015;
    return (totalTokens / 1000000) * costPerMillion;
  }

  private calculateHallucinationRate(results: EvaluationResult[]): number {
    const hallucinationJudges = results
      .flatMap(r => r.judges)
      .filter(j => j.judgeType === JudgeType.HALLUCINATION);

    if (hallucinationJudges.length === 0) {
      return 0;
    }

    const failed = hallucinationJudges.filter(j => !j.passed).length;
    return Math.round((failed / hallucinationJudges.length) * 100);
  }

  private calculateEmpathyScore(results: EvaluationResult[]): number {
    const emotionJudges = results
      .flatMap(r => r.judges)
      .filter(j => j.judgeType === JudgeType.EMOTION);

    if (emotionJudges.length === 0) {
      return 0;
    }

    const sum = emotionJudges.reduce((acc, j) => acc + j.score, 0);
    return Math.round(sum / emotionJudges.length);
  }

  private calculateHumourScore(results: EvaluationResult[]): number {
    const toneJudges = results
      .flatMap(r => r.judges)
      .filter(j => j.judgeType === JudgeType.TONE);

    if (toneJudges.length === 0) {
      return 0;
    }

    const sum = toneJudges.reduce((acc, j) => acc + j.score, 0);
    return Math.round(sum / toneJudges.length);
  }

  private calculatePersonalityConsistency(results: EvaluationResult[]): number {
    const personalityJudges = results
      .flatMap(r => r.judges)
      .filter(j => j.judgeType === JudgeType.PERSONALITY);

    if (personalityJudges.length === 0) {
      return 0;
    }

    const sum = personalityJudges.reduce((acc, j) => acc + j.score, 0);
    return Math.round(sum / personalityJudges.length);
  }

  private calculateConversationContinuity(results: EvaluationResult[]): number {
    const passedCount = results.filter(r => r.passed).length;
    return Math.round((passedCount / results.length) * 100);
  }

  private getEmptyMetrics(): ReportMetrics {
    return {
      memoryRecallRate: 0,
      memoryPrecisionRate: 0,
      relationshipConsistency: 0,
      promptQuality: 0,
      contextQuality: 0,
      averageLatency: 0,
      totalTokenUsage: 0,
      estimatedCost: 0,
      hallucinationRate: 0,
      empathyScore: 0,
      humourScore: 0,
      personalityConsistency: 0,
      conversationContinuity: 0,
    };
  }
}
