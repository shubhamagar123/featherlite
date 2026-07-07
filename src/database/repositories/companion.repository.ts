import { Companion, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type CompanionCreateInput = Prisma.CompanionCreateInput;
type CompanionUpdateInput = Prisma.CompanionUpdateInput;

export class CompanionRepository extends BaseRepository<Companion, CompanionCreateInput, CompanionUpdateInput> {
  protected getDelegate() {
    return prisma.companion;
  }

  protected getModelName(): string {
    return 'Companion';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByUserId(userId: string, options?: FindManyOptions): Promise<Companion[]> {
    return this.findMany({ userId }, options);
  }

  async findActiveByUserId(userId: string, options?: FindManyOptions): Promise<Companion[]> {
    return this.findMany({ userId, status: 'ACTIVE' }, options);
  }

  async findByUserIdAndName(userId: string, name: string): Promise<Companion | null> {
    return this.findOne({ userId, name });
  }

  async findByStatus(status: string, options?: FindManyOptions): Promise<Companion[]> {
    return this.findMany({ status }, options);
  }

  async findArchived(options?: FindManyOptions): Promise<Companion[]> {
    return this.findMany({ status: 'ARCHIVED' }, options);
  }

  async findCreatedAfter(date: Date, options?: FindManyOptions): Promise<Companion[]> {
    return this.findMany({ createdAt: { gte: date } }, options);
  }

  async findLastInteractionAfter(date: Date, options?: FindManyOptions): Promise<Companion[]> {
    return this.findMany({ lastInteractionAt: { gte: date } }, options);
  }

  async findByAiModel(aiModel: string, options?: FindManyOptions): Promise<Companion[]> {
    return this.findMany({ aiModel }, options);
  }

  async findByHighestAffection(userId: string, limit: number = 10): Promise<Companion[]> {
    return this.findMany(
      { userId },
      {
        take: limit,
        orderBy: { affectionLevel: 'desc' },
      }
    );
  }

  async findByEngagementScore(userId: string, minScore: number = 0, limit: number = 10): Promise<Companion[]> {
    return this.findMany(
      { userId, engagementScore: { gte: minScore } },
      {
        take: limit,
        orderBy: { engagementScore: 'desc' },
      }
    );
  }

  async updateVersion(companionId: string, expectedVersion: number, newData: CompanionUpdateInput): Promise<Companion> {
    const updated = await prisma.companion.update({
      where: { id: companionId },
      data: {
        ...newData,
        version: { increment: 1 },
      },
    });

    if (updated.version !== expectedVersion + 1) {
      throw new Error(`Version conflict: expected ${expectedVersion}, got ${updated.version - 1}`);
    }

    return updated;
  }

  async incrementTotalConversations(companionId: string): Promise<Companion> {
    return prisma.companion.update({
      where: { id: companionId },
      data: { totalConversations: { increment: 1 } },
    });
  }

  async incrementTotalMessages(companionId: string, count: number = 1): Promise<Companion> {
    return prisma.companion.update({
      where: { id: companionId },
      data: { totalMessages: { increment: count } },
    });
  }

  async updateAffectionLevel(companionId: string, delta: number): Promise<Companion> {
    return prisma.companion.update({
      where: { id: companionId },
      data: { affectionLevel: { increment: delta } },
    });
  }

  async updateEngagementScore(companionId: string, score: number): Promise<Companion> {
    return prisma.companion.update({
      where: { id: companionId },
      data: { engagementScore: score },
    });
  }

  async updateLastInteraction(companionId: string): Promise<Companion> {
    return prisma.companion.update({
      where: { id: companionId },
      data: { lastInteractionAt: new Date() },
    });
  }

  async findWithRelationships(companionId: string): Promise<(Companion & { relationships: any[] }) | null> {
    try {
      return (await prisma.companion.findUnique({
        where: { id: companionId },
        include: { relationships: { where: { deletedAt: null } } },
      })) as any;
    } catch (error) {
      throw error;
    }
  }

  async findWithConversations(companionId: string, limit: number = 10): Promise<(Companion & { conversations: any[] }) | null> {
    try {
      return (await prisma.companion.findUnique({
        where: { id: companionId },
        include: {
          conversations: {
            where: { deletedAt: null },
            take: limit,
            orderBy: { createdAt: 'desc' } as any,
          },
        },
      })) as any;
    } catch (error) {
      throw error;
    }
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count({ userId });
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.count({ userId, status: 'ACTIVE' });
  }

  async existsByUserIdAndName(userId: string, name: string): Promise<boolean> {
    return this.exists({ userId, name });
  }
}
