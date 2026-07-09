/**
 * Base Judge Class
 * All judges inherit from this to provide consistent evaluation interface
 */

import { JudgeResult, EvaluationScenario, Message, JudgeType } from '../types';
import { createLogger } from '@utils/logger';

export abstract class BaseJudge {
  protected logger = createLogger(this.constructor.name);
  protected judgeType: JudgeType;

  abstract evaluate(
    scenario: EvaluationScenario,
    response: string,
    conversationHistory: Message[]
  ): Promise<JudgeResult>;

  async score(
    scenario: EvaluationScenario,
    response: string,
    conversationHistory: Message[]
  ): Promise<number> {
    try {
      const result = await this.evaluate(scenario, response, conversationHistory);
      return result.score;
    } catch (error) {
      this.logger.error(`Judge evaluation failed: ${error}`);
      return 0;
    }
  }

  protected createResult(
    score: number,
    feedback: string,
    details?: Record<string, any>
  ): JudgeResult {
    return {
      judgeType: this.judgeType,
      score: Math.min(100, Math.max(0, score)),
      feedback,
      passed: score >= 60,
      details,
    };
  }

  protected calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  protected extractKeyEntities(text: string): string[] {
    const entityPattern = /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
    const matches = text.matchAll(entityPattern);
    return Array.from(matches).map(m => m[1]).filter(Boolean);
  }

  protected detectEmotionWords(text: string): string[] {
    const emotionWords = [
      'happy', 'sad', 'angry', 'surprised', 'disgusted', 'afraid',
      'love', 'hate', 'joy', 'sorrow', 'fear', 'excitement',
      'devastated', 'thrilled', 'furious', 'ecstatic', 'miserable',
      'anxious', 'confident', 'hopeful', 'disappointed', 'grateful',
    ];
    return emotionWords.filter(word =>
      text.toLowerCase().includes(word)
    );
  }

  protected countMissingElements(expected: string[], actual: string[]): number {
    return expected.filter(item => !actual.includes(item)).length;
  }
}
