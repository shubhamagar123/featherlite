import { Result } from '../../../services/types/result.type';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

export class FreshnessScorer implements IMemoryScorer {
  score(memories: Memory[], _context: any): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();
      const now = new Date();

      for (const memory of memories) {
        const lastAccessTime = memory.metadata?.lastAccessedAt
          ? new Date(memory.metadata.lastAccessedAt)
          : memory.updatedAt;

        const hoursSinceAccess = Math.floor(
          (now.getTime() - lastAccessTime.getTime()) / (1000 * 60 * 60)
        );

        if (hoursSinceAccess === 0) {
          scores.set(memory.id, 100);
        } else if (hoursSinceAccess < 24) {
          scores.set(memory.id, 90 - (hoursSinceAccess / 24) * 20);
        } else if (hoursSinceAccess < 168) {
          const daysSinceAccess = hoursSinceAccess / 24;
          scores.set(memory.id, Math.max(30, 70 - daysSinceAccess * 5));
        } else {
          scores.set(memory.id, 20);
        }
      }

      return scores;
    });
  }
}
