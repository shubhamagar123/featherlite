import { Result } from '../../../services/types/result.type';
import { Memory } from '../dto/memory.dto';
import { MemoryType, MemoryStatus } from '../enums/memory.enums';
import { IMemoryRepository } from '../interfaces/memory.interfaces';

export class MemoryRepository implements IMemoryRepository {
  private memories: Map<string, Memory> = new Map();

  save(memory: Memory): Result<Memory> {
    return Result.try(() => {
      this.memories.set(memory.id, { ...memory });
      return this.memories.get(memory.id)!;
    });
  }

  findById(memoryId: string): Result<Memory | null> {
    return Result.try(() => {
      const memory = this.memories.get(memoryId);
      return memory ? { ...memory } : null;
    });
  }

  findByUserId(userId: string): Result<Memory[]> {
    return Result.try(() => {
      return Array.from(this.memories.values())
        .filter((m) => m.userId === userId)
        .map((m) => ({ ...m }));
    });
  }

  findByRelationshipId(relationshipId: string): Result<Memory[]> {
    return Result.try(() => {
      return Array.from(this.memories.values())
        .filter((m) => m.relationshipId === relationshipId)
        .map((m) => ({ ...m }));
    });
  }

  findByType(memoryType: MemoryType): Result<Memory[]> {
    return Result.try(() => {
      return Array.from(this.memories.values())
        .filter((m) => m.memoryType === memoryType)
        .map((m) => ({ ...m }));
    });
  }

  findByStatus(status: MemoryStatus): Result<Memory[]> {
    return Result.try(() => {
      return Array.from(this.memories.values())
        .filter((m) => m.status === status)
        .map((m) => ({ ...m }));
    });
  }

  update(memory: Memory): Result<Memory> {
    return Result.try(() => {
      if (!this.memories.has(memory.id)) {
        throw new Error(`Memory with id ${memory.id} not found`);
      }
      this.memories.set(memory.id, { ...memory });
      return this.memories.get(memory.id)!;
    });
  }

  delete(memoryId: string): Result<void> {
    return Result.try(() => {
      if (!this.memories.has(memoryId)) {
        throw new Error(`Memory with id ${memoryId} not found`);
      }
      this.memories.delete(memoryId);
    });
  }

  getAll(): Result<Memory[]> {
    return Result.try(() => {
      return Array.from(this.memories.values()).map((m) => ({ ...m }));
    });
  }
}
