import { Result } from '../../../services/types/result.type';
import { Memory } from '../dtos/memory.dto';
import { MemoryType, MemoryStatus } from '../enums/memory.enums';
import { IMemoryRetentionStrategy } from '../interfaces/memory.interfaces';

export class MemoryRetentionStrategy implements IMemoryRetentionStrategy {
  private readonly criticalMemoryTypes = [
    MemoryType.RELATIONSHIP,
    MemoryType.PERSON,
    MemoryType.LONG_TERM,
    MemoryType.GOAL,
  ];

  decide(memories: Memory[]): Result<Memory[]> {
    return Result.try(() => {
      const retained: Memory[] = [];

      const activeMemories = memories.filter(
        (m) => m.status === MemoryStatus.ACTIVE
      );

      const critical = activeMemories.filter((m) =>
        this.criticalMemoryTypes.includes(m.memoryType)
      );

      const highImportance = activeMemories
        .filter(
          (m) =>
            !this.criticalMemoryTypes.includes(m.memoryType) &&
            m.importance > 0.7
        )
        .sort((a, b) => b.importance - a.importance);

      const mediumImportance = activeMemories
        .filter((m) => m.importance > 0.4 && m.importance <= 0.7)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      const lowImportance = activeMemories.filter((m) => m.importance <= 0.4);

      retained.push(...critical);

      const maxHighImportance = Math.ceil(critical.length * 2);
      retained.push(...highImportance.slice(0, maxHighImportance));

      const maxMediumImportance = Math.max(
        10,
        Math.ceil((critical.length + highImportance.length) * 0.5)
      );
      retained.push(...mediumImportance.slice(0, maxMediumImportance));

      const maxLowImportance = Math.max(
        5,
        Math.ceil((critical.length + highImportance.length) * 0.25)
      );
      retained.push(
        ...lowImportance
          .filter(
            (m) =>
              m.confidence > 0.6 ||
              m.tags.length > 0
          )
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, maxLowImportance)
      );

      const archived = memories.filter(
        (m) => m.status === MemoryStatus.ARCHIVED
      );

      return [...retained, ...archived];
    });
  }
}
