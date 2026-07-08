import { Result } from '../../../services/types/result.type';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

export class ExpiryScorer implements IMemoryScorer {
  score(memories: Memory[], _context: any): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();
      const now = new Date();

      for (const memory of memories) {
        if (!memory.expiryAt) {
          scores.set(memory.id, 100);
          continue;
        }

        const daysUntilExpiry = Math.floor(
          (memory.expiryAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry > 30) {
          scores.set(memory.id, 100);
        } else if (daysUntilExpiry > 7) {
          scores.set(memory.id, 80 + daysUntilExpiry);
        } else if (daysUntilExpiry > 0) {
          scores.set(memory.id, 50 + daysUntilExpiry * 5);
        } else {
          scores.set(memory.id, 0);
        }
      }

      return scores;
    });
  }
}
