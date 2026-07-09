import { Result } from '../../../services/types/result.type';
import { Memory } from '@engines/memory/dtos/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

export class ConversationRelevanceScorer implements IMemoryScorer {
  score(memories: Memory[], context: any): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();
      const conversationHistory = (context?.conversationHistory || []) as string[];

      if (conversationHistory.length === 0) {
        for (const memory of memories) {
          scores.set(memory.id, 50);
        }
        return scores;
      }

      const historyText = conversationHistory.join(' ').toLowerCase();
      const historyTokens = new Set(historyText.split(/\s+/));

      for (const memory of memories) {
        const memoryText = `${memory.description} ${(memory.entities || [])
          .map((e) => e.name)
          .join(' ')}`.toLowerCase();
        const memoryTokens = memoryText.split(/\s+/);

        const matches = memoryTokens.filter((token) => historyTokens.has(token)).length;
        const score = Math.min(100, (matches / Math.max(1, memoryTokens.length)) * 100);

        scores.set(memory.id, score);
      }

      return scores;
    });
  }
}
