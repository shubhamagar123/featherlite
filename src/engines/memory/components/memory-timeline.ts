import { Result } from '../../../services/types/result.type';
import { Memory } from '../dto/memory.dto';
import { IMemoryTimeline } from '../interfaces/memory.interfaces';

export class MemoryTimeline implements IMemoryTimeline {
  private entries: Map<string, Memory[]> = new Map();

  addEntry(memory: Memory): Result<void> {
    return Result.try(() => {
      const key = this.getKey(memory.userId, memory.relationshipId);

      if (!this.entries.has(key)) {
        this.entries.set(key, []);
      }

      const timeline = this.entries.get(key)!;
      const index = timeline.findIndex((m) => m.id === memory.id);

      if (index >= 0) {
        timeline[index] = memory;
      } else {
        timeline.push(memory);
      }

      timeline.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
    });
  }

  getTimeline(userId: string, relationshipId?: string): Result<Memory[]> {
    return Result.try(() => {
      const key = this.getKey(userId, relationshipId);
      return this.entries.get(key) || [];
    });
  }

  private getKey(userId: string, relationshipId?: string): string {
    return `${userId}:${relationshipId || 'global'}`;
  }
}
