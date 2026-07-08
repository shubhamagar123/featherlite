import { Result } from '../../../services/types/result.type';
import { Memory, MemorySnapshot } from '../dto/memory.dto';
import { MemoryType, MemoryStatus } from '../enums/memory.enums';
import { IMemorySnapshotBuilder, IMemoryRepository } from '../interfaces/memory.interfaces';

export class MemorySnapshotBuilder implements IMemorySnapshotBuilder {
  constructor(private repository: IMemoryRepository) {}

  buildSnapshot(
    userId: string,
    relationshipId?: string
  ): Result<MemorySnapshot> {
    return Result.try(() => {
      const allMemoriesResult = this.repository.findByUserId(userId);
      if (!allMemoriesResult.isSuccess) {
        throw new Error(`Failed to fetch memories: ${allMemoriesResult.error}`);
      }

      const userMemories = allMemoriesResult.getValueOrDefault([])
        .filter(
          (m) =>
            !relationshipId || m.relationshipId === relationshipId
        )
        .filter((m) => m.status === MemoryStatus.ACTIVE);

      const distribution: Record<MemoryType, number> = {} as Record<
        MemoryType,
        number
      >;

      for (const memoryType of Object.values(MemoryType)) {
        distribution[memoryType as MemoryType] = 0;
      }

      for (const memory of userMemories) {
        distribution[memory.memoryType]++;
      }

      const importances = userMemories.map((m) => m.importance);
      const confidences = userMemories.map((m) => m.confidence);

      const averageImportance =
        importances.length > 0
          ? importances.reduce((a, b) => a + b) / importances.length
          : 0;

      const averageConfidence =
        confidences.length > 0
          ? confidences.reduce((a, b) => a + b) / confidences.length
          : 0;

      const oldestMemory =
        userMemories.length > 0
          ? userMemories.reduce((oldest, current) =>
              current.createdAt < oldest.createdAt ? current : oldest
            )
          : undefined;

      const newestMemory =
        userMemories.length > 0
          ? userMemories.reduce((newest, current) =>
              current.updatedAt > newest.updatedAt ? current : newest
            )
          : undefined;

      return {
        userId,
        relationshipId,
        totalMemories: userMemories.length,
        memoryTypeDistribution: distribution,
        averageImportance,
        averageConfidence,
        oldestMemory,
        newestMemory,
        snapshotDate: new Date(),
      };
    });
  }
}
