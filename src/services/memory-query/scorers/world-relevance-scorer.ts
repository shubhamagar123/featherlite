import { Result } from '../../../services/types/result.type';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

export class WorldRelevanceScorer implements IMemoryScorer {
  score(memories: Memory[], context: any): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();
      const currentScene = context?.currentScene;

      if (!currentScene) {
        for (const memory of memories) {
          scores.set(memory.id, 50);
        }
        return scores;
      }

      const sceneTokens = new Set(currentScene.toLowerCase().split(/\s+/));

      for (const memory of memories) {
        const memoryText = `${memory.content} ${(memory.metadata?.location || '')} ${(memory.metadata?.context || '')}`.toLowerCase();
        const memoryTokens = memoryText.split(/\s+/);

        const matches = Array.from(sceneTokens).filter((token) =>
          memoryTokens.some((mt) => mt.includes(token) || token.includes(mt))
        ).length;

        const score = sceneTokens.size > 0 ? (matches / sceneTokens.size) * 100 : 50;
        scores.set(memory.id, Math.min(100, score));
      }

      return scores;
    });
  }
}
