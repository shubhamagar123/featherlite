import { Result } from '../../../services/types/result.type';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

export class RecencyScorer implements IMemoryScorer {
  score(memories: Memory[], _context: any): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();
      const now = new Date();

      for (const memory of memories) {
        const ageInDays = Math.floor(
          (now.getTime() - memory.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        let score = 100;

        if (ageInDays === 0) {
          score = 100;
        } else if (ageInDays === 1) {
          score = 90;
        } else if (ageInDays < 7) {
          score = 80 - ageInDays * 2;
        } else if (ageInDays < 30) {
          score = 60 - (ageInDays - 7) * 1;
        } else if (ageInDays < 90) {
          score = 40 - (ageInDays - 30) * 0.5;
        } else {
          score = Math.max(0, 20 - (ageInDays - 90) * 0.1);
        }

        scores.set(memory.id, Math.max(0, Math.min(100, score)));
      }

      return scores;
    });
  }
}
