import { Memory, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type MemoryCreateInput = Prisma.MemoryCreateInput;
type MemoryUpdateInput = Prisma.MemoryUpdateInput;

export class MemoryRepository extends BaseRepository<Memory, MemoryCreateInput, MemoryUpdateInput> {
  protected getDelegate() {
    return prisma.memory;
  }

  protected getModelName(): string {
    return 'Memory';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByCompanionId(companionId: string, options?: FindManyOptions): Promise<Memory[]> {
    return this.findMany({ companionId }, options);
  }

  async findByUserId(userId: string, options?: FindManyOptions): Promise<Memory[]> {
    return this.findMany({ userId }, options);
  }

  async findByType(type: string, options?: FindManyOptions): Promise<Memory[]> {
    return this.findMany({ type }, options);
  }

  async findByImportance(importance: string, options?: FindManyOptions): Promise<Memory[]> {
    return this.findMany({ importance }, options);
  }

  async findCriticalMemories(companionId: string, options?: FindManyOptions): Promise<Memory[]> {
    return this.findMany({ companionId, importance: 'CRITICAL' }, options);
  }

  async findSignificantMemories(companionId: string, options?: FindManyOptions): Promise<Memory[]> {
    return this.findMany({ companionId, importance: 'SIGNIFICANT' }, options);
  }

  async findByCompanionIdAndType(
    companionId: string,
    type: string,
    options?: FindManyOptions
  ): Promise<Memory[]> {
    return this.findMany({ companionId, type }, options);
  }

  async findByCompanionIdAndImportance(
    companionId: string,
    importance: string,
    options?: FindManyOptions
  ): Promise<Memory[]> {
    return this.findMany({ companionId, importance }, options);
  }

  async findByCreatedAfter(date: Date, options?: FindManyOptions): Promise<Memory[]> {
    return this.findMany({ createdAt: { gte: date } }, options);
  }

  async findByAccessedAfter(date: Date, options?: FindManyOptions): Promise<Memory[]> {
    return this.findMany({ lastAccessedAt: { gte: date } }, options);
  }

  async findMostFrequentlyAccessed(companionId: string, limit: number = 10): Promise<Memory[]> {
    return this.findMany(
      { companionId },
      {
        take: limit,
        orderBy: { accessCount: 'desc' },
      }
    );
  }

  async findMostRecentlyAccessed(companionId: string, limit: number = 10): Promise<Memory[]> {
    return this.findMany(
      { companionId },
      {
        take: limit,
        orderBy: { lastAccessedAt: 'desc' },
      }
    );
  }

  async findByCreatedOrder(companionId: string, direction: 'asc' | 'desc' = 'desc', limit: number = 10): Promise<Memory[]> {
    return this.findMany(
      { companionId },
      {
        take: limit,
        orderBy: { createdAt: direction },
      }
    );
  }

  async findByContentSearch(companionId: string, keyword: string, options?: FindManyOptions): Promise<Memory[]> {
    return this.findMany(
      {
        companionId,
        content: { contains: keyword, mode: 'insensitive' },
      },
      options
    );
  }

  async incrementAccessCount(memoryId: string): Promise<Memory> {
    return prisma.memory.update({
      where: { id: memoryId },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });
  }

  async updateImportance(memoryId: string, importance: string): Promise<Memory> {
    return this.update(memoryId, { importance } as any);
  }

  async updateContent(memoryId: string, content: string): Promise<Memory> {
    return this.update(memoryId, { content } as any);
  }

  async countByCompanionId(companionId: string): Promise<number> {
    return this.count({ companionId });
  }

  async countByCompanionIdAndType(companionId: string, type: string): Promise<number> {
    return this.count({ companionId, type });
  }

  async countByCompanionIdAndImportance(companionId: string, importance: string): Promise<number> {
    return this.count({ companionId, importance });
  }

  async countCriticalMemories(companionId: string): Promise<number> {
    return this.countByCompanionIdAndImportance(companionId, 'CRITICAL');
  }

  async countSignificantMemories(companionId: string): Promise<number> {
    return this.countByCompanionIdAndImportance(companionId, 'SIGNIFICANT');
  }

  async existsByCompanionId(companionId: string): Promise<boolean> {
    return this.exists({ companionId });
  }
}
