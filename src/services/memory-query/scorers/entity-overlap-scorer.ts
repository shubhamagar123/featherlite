import { Result } from '../../../services/types/result.type';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

export class EntityOverlapScorer implements IMemoryScorer {
  score(memories: Memory[], context: any): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();
      const contextEntities = new Set<string>(
        (context?.recentEntities || []).map((e: string) => e.toLowerCase())
      );

      if (contextEntities.size === 0) {
        for (const memory of memories) {
          scores.set(memory.id, 50);
        }
        return scores;
      }

      for (const memory of memories) {
        const memoryEntities = new Set(
          memory.entities.map((e) => e.name.toLowerCase())
        );

        const overlap = Array.from(contextEntities).filter((e) =>
          memoryEntities.has(e)
        ).length;

        const score = (overlap / contextEntities.size) * 100;
        scores.set(memory.id, Math.min(100, score));
      }

      return scores;
    });
  }
}
