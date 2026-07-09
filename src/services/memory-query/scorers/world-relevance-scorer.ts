import { Result } from '../../../services/types/result.type';
import { Memory } from '@engines/memory/dtos/memory.dto';
import { IMemoryScorer } from '../interfaces/memory-query.interfaces';

interface WorldContext {
  currentScene?: string;
}

export class WorldRelevanceScorer implements IMemoryScorer {
  score(memories: Memory[], context: WorldContext | null | undefined): Result<Map<string, number>> {
    return Result.try(() => {
      const scores = new Map<string, number>();
      const currentScene = context?.currentScene;

      if (!currentScene) {
        for (const memory of memories) {
          scores.set(memory.id, 50);
        }
        return scores;
      }

      const sceneTokens = new Set<string>(currentScene.toLowerCase().split(/\s+/));

      for (const memory of memories) {
        const memoryText = `${memory.description} ${String(memory.metadata?.location ?? '')} ${String(memory.metadata?.context ?? '')}`.toLowerCase();
        const memoryTokens: string[] = memoryText.split(/\s+/);

        const matches = Array.from(sceneTokens).filter((token: string) =>
          memoryTokens.some((mt: string) => mt.includes(token) || token.includes(mt))
        ).length;

        const score = sceneTokens.size > 0 ? (matches / sceneTokens.size) * 100 : 50;
        scores.set(memory.id, Math.min(100, score));
      }

      return scores;
    });
  }
}
