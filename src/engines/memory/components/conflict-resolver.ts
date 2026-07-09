import { Result } from '../../../services/types/result.type';
import { ConflictResolutionResult, Memory } from '../dtos/memory.dto';
import { IConflictResolver } from '../interfaces/memory.interfaces';

export class ConflictResolver implements IConflictResolver {
  resolve(
    existingMemory: Memory,
    newMemory: Memory
  ): Result<ConflictResolutionResult> {
    return Result.try(() => {
      const similarities = this.calculateSimilarity(existingMemory, newMemory);

      if (similarities.textSimilarity > 0.8) {
        if (newMemory.confidence > existingMemory.confidence) {
          return {
            resolution: 'KEEP_NEW',
            mergedMemory: newMemory,
            reasoning: `New memory has higher confidence (${newMemory.confidence.toFixed(2)} vs ${existingMemory.confidence.toFixed(2)}) and similar content.`,
          };
        } else {
          return {
            resolution: 'KEEP_EXISTING',
            mergedMemory: existingMemory,
            reasoning: `Existing memory has higher confidence (${existingMemory.confidence.toFixed(2)} vs ${newMemory.confidence.toFixed(2)}) and similar content.`,
          };
        }
      }

      if (
        existingMemory.description.toLowerCase().includes('contradicts') ||
        newMemory.description.toLowerCase().includes('contradicts')
      ) {
        return {
          resolution: 'MARK_CONFLICT',
          reasoning:
            'Direct contradiction detected in memory content. Manual review required.',
        };
      }

      const existingEntities = new Set(
        existingMemory.entities.map((e) => e.name.toLowerCase())
      );
      const newEntities = new Set(
        newMemory.entities.map((e) => e.name.toLowerCase())
      );
      const commonEntities = Array.from(existingEntities).filter((e) =>
        newEntities.has(e)
      );

      if (commonEntities.length > 0 && similarities.contentDivergence > 0.6) {
        return {
          resolution: 'MARK_CONFLICT',
          reasoning: `Conflicting information about ${commonEntities.join(', ')}. Requires resolution strategy.`,
        };
      }

      if (similarities.entityOverlap > 0.5 && similarities.typeSimilarity > 0.7) {
        return {
          resolution: 'MERGE',
          mergedMemory: this.mergeMemories(existingMemory, newMemory),
          reasoning: `Memories are complementary (${similarities.entityOverlap.toFixed(2)} entity overlap, ${similarities.typeSimilarity.toFixed(2)} type similarity). Safe to merge.`,
        };
      }

      return {
        resolution: 'KEEP_NEW',
        mergedMemory: newMemory,
        reasoning: 'No significant conflict detected. New memory retained.',
      };
    });
  }

  private calculateSimilarity(existing: Memory, newMemory: Memory) {
    const textSimilarity = this.levenshteinSimilarity(
      existing.description,
      newMemory.description
    );

    const existingWords = new Set(existing.description.toLowerCase().split(/\s+/));
    const newWords = new Set(newMemory.description.toLowerCase().split(/\s+/));
    const commonWords = Array.from(existingWords).filter((w) =>
      newWords.has(w)
    ).length;
    const contentDivergence =
      1 -
      (commonWords /
        Math.max(existingWords.size, newWords.size));

    const existingEntities = new Set(
      existing.entities.map((e) => e.name.toLowerCase())
    );
    const newEntities = new Set(
      newMemory.entities.map((e) => e.name.toLowerCase())
    );
    const commonEntities = Array.from(existingEntities).filter((e) =>
      newEntities.has(e)
    ).length;
    const entityOverlap =
      commonEntities /
      Math.max(existingEntities.size, newEntities.size, 1);

    const typeSimilarity =
      existing.memoryType === newMemory.memoryType ? 1.0 : 0.5;

    return {
      textSimilarity,
      contentDivergence,
      entityOverlap,
      typeSimilarity,
    };
  }

  private levenshteinSimilarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    return 1 - distance / maxLen;
  }

  private levenshteinDistance(a: string, b: string): number {
    const dp: number[][] = Array(a.length + 1)
      .fill(null)
      .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= b.length; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] =
            1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[a.length][b.length];
  }

  private mergeMemories(existing: Memory, newMemory: Memory): Memory {
    const mergedEntities = [
      ...existing.entities,
      ...newMemory.entities.filter(
        (ne) =>
          !existing.entities.some(
            (ee) => ee.name.toLowerCase() === ne.name.toLowerCase()
          )
      ),
    ];

    const mergedTags = Array.from(
      new Set([...existing.tags, ...newMemory.tags])
    );

    return {
      ...existing,
      description: `${existing.description}\n---\n${newMemory.description}`,
      entities: mergedEntities,
      tags: mergedTags,
      confidence:
        (existing.confidence + newMemory.confidence) / 2,
      importance: Math.max(existing.importance, newMemory.importance),
      updatedAt: new Date(),
    };
  }
}
