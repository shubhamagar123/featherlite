import { Memory } from '@prisma/client';
import { MemoryDTO, MemoryMetadataDTO } from '../dtos/memory.dto';

export class MemoryMapper {
  static toDTO(memory: Memory): MemoryDTO {
    return {
      id: memory.id,
      userId: memory.userId,
      companionId: memory.companionId,
      type: memory.type,
      importance: memory.importance,
      content: memory.content,
      accessCount: memory.accessCount,
      lastAccessedAt: memory.lastAccessedAt || undefined,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
    };
  }

  static toMetadataDTO(memory: Memory): MemoryMetadataDTO {
    return {
      id: memory.id,
      type: memory.type,
      importance: memory.importance,
      accessCount: memory.accessCount,
      createdAt: memory.createdAt,
    };
  }

  static toDTOArray(memories: Memory[]): MemoryDTO[] {
    return memories.map((m) => this.toDTO(m));
  }
}
