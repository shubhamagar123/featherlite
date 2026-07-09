import { Result } from '../../../services/types/result.type';
import { ImportanceEvaluationResult, Memory } from '../dtos/memory.dto';
import { MemoryType } from '../enums/memory.enums';
import { IImportanceEvaluator } from '../interfaces/memory.interfaces';

export class ImportanceEvaluator implements IImportanceEvaluator {
  evaluate(memory: Partial<Memory>): Result<ImportanceEvaluationResult> {
    return Result.try(() => {
      const factors: Record<string, number> = {};
      let totalScore = 0;

      const textLength = (memory.description || '').length;
      factors.textLength = Math.min(100, textLength / 2);
      totalScore += factors.textLength * 0.05;

      if (memory.entities && memory.entities.length > 0) {
        factors.entityCount = Math.min(100, memory.entities.length * 10);
        totalScore += factors.entityCount * 0.1;
      } else {
        factors.entityCount = 0;
      }

      const emotionalKeywords = [
        'love',
        'hate',
        'important',
        'significant',
        'meaningful',
        'memorable',
        'tragic',
        'joyful',
        'profound',
      ];
      const text = (
        (memory.title || '') +
        ' ' +
        (memory.description || '')
      ).toLowerCase();
      let emotionalScore = 0;
      for (const keyword of emotionalKeywords) {
        if (text.includes(keyword)) {
          emotionalScore += 15;
        }
      }
      factors.emotionalSignificance = Math.min(100, emotionalScore);
      totalScore += factors.emotionalSignificance * 0.25;

      if (memory.tags && memory.tags.length > 0) {
        factors.tagCount = Math.min(100, memory.tags.length * 15);
        totalScore += factors.tagCount * 0.1;
      } else {
        factors.tagCount = 0;
      }

      const memoryTypeWeights: Record<MemoryType, number> = {
        [MemoryType.RELATIONSHIP]: 30,
        [MemoryType.PERSON]: 25,
        [MemoryType.GOAL]: 25,
        [MemoryType.LONG_TERM]: 25,
        [MemoryType.EVENT]: 20,
        [MemoryType.HEALTH]: 20,
        [MemoryType.WORK]: 15,
        [MemoryType.TRAVEL]: 15,
        [MemoryType.ROUTINE]: 10,
        [MemoryType.PREFERENCE]: 10,
        [MemoryType.HABIT]: 10,
        [MemoryType.FOOD]: 5,
        [MemoryType.CONTEXT]: 5,
        [MemoryType.TEMPORARY]: 3,
        [MemoryType.CONVERSATION_CALLBACK]: 8,
      };

      factors.memoryTypeWeight =
        memoryTypeWeights[memory.memoryType || MemoryType.CONTEXT] || 5;
      totalScore += factors.memoryTypeWeight * 0.2;

      if (memory.confidence !== undefined && memory.confidence > 0) {
        factors.confidence = memory.confidence * 100;
        totalScore += factors.confidence * 0.15;
      } else {
        factors.confidence = 50;
        totalScore += 50 * 0.15;
      }

      const finalImportance = Math.min(100, totalScore);

      const reasoning =
        `Importance score based on emotional significance (${factors.emotionalSignificance.toFixed(0)}), ` +
        `memory type weight (${factors.memoryTypeWeight}), entity count (${factors.entityCount.toFixed(0)}), ` +
        `confidence level (${factors.confidence.toFixed(0)}), and text length (${factors.textLength.toFixed(0)}).`;

      return {
        importance: finalImportance / 100,
        factors,
        reasoning,
      };
    });
  }
}
