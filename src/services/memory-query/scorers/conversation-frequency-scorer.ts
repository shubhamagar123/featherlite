import { Result } from '../../../services/types/result.type';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

export class ConversationFrequencyScorer implements IMemoryScorer {
  score(memories: Memory[], _context: any): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();

      if (memories.length === 0) {
        return scores;
      }

      const maxFrequency = Math.max(
        ...memories.map((m) => m.metadata?.accessCount || 0)
      );

      for (const memory of memories) {
        const accessCount = memory.metadata?.accessCount || 0;

        if (maxFrequency === 0) {
          scores.set(memory.id, 50);
          continue;
        }

        const frequencyScore = (accessCount / maxFrequency) * 100;
        scores.set(memory.id, Math.min(100, frequencyScore));
      }

      return scores;
    });
  }
}
