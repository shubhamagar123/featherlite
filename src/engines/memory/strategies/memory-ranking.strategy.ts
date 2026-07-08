import { Result } from '../../../services/types/result.type';
import { Memory, RankingScores } from '../dto/memory.dto';
import { IMemoryRankingStrategy } from '../interfaces/memory.interfaces';

export class MemoryRankingStrategy implements IMemoryRankingStrategy {
  rank(memories: Memory[]): Result<RankingScores[]> {
    return Result.try(() => {
      const scores = memories.map((memory) => ({
        memoryId: memory.id,
        recencyScore: this.calculateRecencyScore(memory),
        importanceScore: memory.importance * 100,
        confidenceScore: memory.confidence * 100,
        relevanceScore: this.calculateRelevanceScore(memory),
        finalRank: 0,
      }));

      for (const score of scores) {
        score.finalRank =
          score.recencyScore * 0.2 +
          score.importanceScore * 0.35 +
          score.confidenceScore * 0.25 +
          score.relevanceScore * 0.2;
      }

      return scores.sort((a, b) => b.finalRank - a.finalRank);
    });
  }

  private calculateRecencyScore(memory: Memory): number {
    const now = new Date();
    const ageInDays = (now.getTime() - memory.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays < 1) {
      return 100;
    } else if (ageInDays < 7) {
      return 100 - ageInDays * 10;
    } else if (ageInDays < 30) {
      return 60 - (ageInDays - 7) * 1.5;
    } else {
      return Math.max(0, 30 - (ageInDays - 30) * 0.5);
    }
  }

  private calculateRelevanceScore(memory: Memory): number {
    let score = 50;

    if (memory.tags.length > 0) {
      score += Math.min(50, memory.tags.length * 10);
    }

    if (memory.entities.length > 0) {
      score += Math.min(30, memory.entities.length * 5);
    }

    return Math.min(100, score);
  }
}
