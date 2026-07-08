import { Result } from '../../../services/types/result.type';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

export class RelationshipRelevanceScorer implements IMemoryScorer {
  score(memories: Memory[], context: any): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();
      const relationshipId = context?.relationshipId;

      if (!relationshipId) {
        for (const memory of memories) {
          scores.set(memory.id, 50);
        }
        return scores;
      }

      for (const memory of memories) {
        if (memory.relationshipId === relationshipId) {
          scores.set(memory.id, 100);
        } else if (memory.relationshipId) {
          scores.set(memory.id, 30);
        } else {
          scores.set(memory.id, 0);
        }
      }

      return scores;
    });
  }
}
