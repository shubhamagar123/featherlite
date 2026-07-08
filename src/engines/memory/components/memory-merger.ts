import { Result } from '../../../services/types/result.type';
import { Memory, MemoryMergeResult } from '../dto/memory.dto';
import { MemoryStatus } from '../enums/memory.enums';
import { IMemoryMerger } from '../interfaces/memory.interfaces';
import { v4 as uuid } from 'uuid';

export class MemoryMerger implements IMemoryMerger {
  merge(memories: Memory[]): Result<MemoryMergeResult> {
    return Result.try(() => {
      if (memories.length === 0) {
        throw new Error('Cannot merge empty memory array');
      }

      if (memories.length === 1) {
        return {
          mergedMemory: memories[0],
          mergedIds: [memories[0].id],
          mergedCount: 1,
          conflictsResolved: 0,
        };
      }

      const [primary] = memories.sort((a, b) => b.importance - a.importance);

      const mergedEntities = this.mergeEntities(memories);
      const mergedTags = Array.from(
        new Set(memories.flatMap((m) => m.tags))
      );

      const descriptions = memories
        .map((m, idx) => `[Memory ${idx + 1}]:\n${m.description}`)
        .join('\n\n---\n\n');

      const mergedMemory: Memory = {
        ...primary,
        id: uuid(),
        title: this.mergeTitle(memories),
        description: descriptions,
        entities: mergedEntities,
        tags: mergedTags,
        confidence: this.calculateMergedConfidence(memories),
        importance: this.calculateMergedImportance(memories),
        createdAt: new Date(Math.min(...memories.map((m) => m.createdAt.getTime()))),
        updatedAt: new Date(),
        status: MemoryStatus.ACTIVE,
      };

      const conflictsResolved = memories.length - 1;

      return {
        mergedMemory,
        mergedIds: memories.map((m) => m.id),
        mergedCount: memories.length,
        conflictsResolved,
      };
    });
  }

  private mergeTitle(memories: Memory[]): string {
    if (memories.length === 0) return '';

    const titles = memories.map((m) => m.title);
    const commonWords = this.findCommonWords(titles);

    if (commonWords.length > 0) {
      return commonWords.join(' ');
    }

    return titles[0];
  }

  private findCommonWords(titles: string[]): string[] {
    if (titles.length === 0) return [];

    const titleSets = titles.map((t) =>
      new Set(t.toLowerCase().split(/\s+/))
    );

    const common = Array.from(titleSets[0]).filter((word) =>
      titleSets.every((set) => set.has(word))
    );

    return common.filter((w) => w.length > 3);
  }

  private mergeEntities(memories: Memory[]) {
    const entityMap = new Map<string, typeof memories[0]['entities'][0]>();

    for (const memory of memories) {
      for (const entity of memory.entities) {
        const key = `${entity.type}:${entity.name.toLowerCase()}`;
        if (!entityMap.has(key)) {
          entityMap.set(key, entity);
        } else {
          const existing = entityMap.get(key)!;
          if (
            entity.description &&
            (!existing.description ||
              entity.description.length > existing.description.length)
          ) {
            entityMap.set(key, {
              ...existing,
              description: entity.description,
              context: entity.context || existing.context,
            });
          }
        }
      }
    }

    return Array.from(entityMap.values());
  }

  private calculateMergedConfidence(memories: Memory[]): number {
    const weights = memories.map((m) => m.importance);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const weightedConfidence = memories.reduce(
      (sum, m, idx) => sum + (m.confidence * weights[idx]) / totalWeight,
      0
    );

    return Math.min(1.0, weightedConfidence * 1.1);
  }

  private calculateMergedImportance(memories: Memory[]): number {
    return Math.max(...memories.map((m) => m.importance));
  }
}
