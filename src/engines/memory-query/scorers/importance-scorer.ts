import { Result } from '@services/types/result.type';
import { Memory } from '@engines/memory/dtos/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

export class ImportanceScorer implements IMemoryScorer {
  score(memories: Memory[], _context: any): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();

      for (const memory of memories) {
        const score = memory.importance * 100;
        scores.set(memory.id, Math.min(100, score));
      }

      return scores;
    });
  }
}
