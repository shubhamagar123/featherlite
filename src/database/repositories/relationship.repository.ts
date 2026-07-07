import { Relationship, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type RelationshipCreateInput = Prisma.RelationshipCreateInput;
type RelationshipUpdateInput = Prisma.RelationshipUpdateInput;

export class RelationshipRepository extends BaseRepository<
  Relationship,
  RelationshipCreateInput,
  RelationshipUpdateInput
> {
  protected getDelegate() {
    return prisma.relationship;
  }

  protected getModelName(): string {
    return 'Relationship';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByUserId(userId: string, options?: FindManyOptions): Promise<Relationship[]> {
    return this.findMany({ userId }, options);
  }

  async findByCompanionId(companionId: string, options?: FindManyOptions): Promise<Relationship[]> {
    return this.findMany({ companionId }, options);
  }

  async findByUserIdAndCompanionId(userId: string, companionId: string): Promise<Relationship | null> {
    return this.findOne({ userId, companionId });
  }

  async findActiveByUserId(userId: string, options?: FindManyOptions): Promise<Relationship[]> {
    return this.findMany({ userId, status: 'ACTIVE' }, options);
  }

  async findPausedByUserId(userId: string, options?: FindManyOptions): Promise<Relationship[]> {
    return this.findMany({ userId, status: 'PAUSED' }, options);
  }

  async findEndedByUserId(userId: string, options?: FindManyOptions): Promise<Relationship[]> {
    return this.findMany({ userId, status: 'ENDED' }, options);
  }

  async findByStatus(status: string, options?: FindManyOptions): Promise<Relationship[]> {
    return this.findMany({ status }, options);
  }

  async findByLevel(level: string, options?: FindManyOptions): Promise<Relationship[]> {
    return this.findMany({ level }, options);
  }

  async findByHighestAffection(userId: string, limit: number = 10): Promise<Relationship[]> {
    return this.findMany(
      { userId },
      {
        take: limit,
        orderBy: { affectionScore: 'desc' },
      }
    );
  }

  async findByHighestTrust(userId: string, limit: number = 10): Promise<Relationship[]> {
    return this.findMany(
      { userId },
      {
        take: limit,
        orderBy: { trustScore: 'desc' },
      }
    );
  }

  async findByHighestFamiliarity(userId: string, limit: number = 10): Promise<Relationship[]> {
    return this.findMany(
      { userId },
      {
        take: limit,
        orderBy: { familiarityScore: 'desc' },
      }
    );
  }

  async findByLastInteraction(userId: string, options?: FindManyOptions): Promise<Relationship[]> {
    return this.findMany(
      { userId },
      {
        ...options,
        orderBy: { lastInteractionAt: 'desc' },
      }
    );
  }

  async findFirstInteractionBefore(date: Date, options?: FindManyOptions): Promise<Relationship[]> {
    return this.findMany(
      { firstInteractionAt: { lte: date } },
      options
    );
  }

  async updateAffectionScore(relationshipId: string, delta: number): Promise<Relationship> {
    return prisma.relationship.update({
      where: { id: relationshipId },
      data: { affectionScore: { increment: delta } },
    });
  }

  async updateTrustScore(relationshipId: string, delta: number): Promise<Relationship> {
    return prisma.relationship.update({
      where: { id: relationshipId },
      data: { trustScore: { increment: delta } },
    });
  }

  async updateFamiliarityScore(relationshipId: string, delta: number): Promise<Relationship> {
    return prisma.relationship.update({
      where: { id: relationshipId },
      data: { familiarityScore: { increment: delta } },
    });
  }

  async updateLastInteraction(relationshipId: string): Promise<Relationship> {
    return prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        lastInteractionAt: new Date(),
        totalInteractions: { increment: 1 },
      },
    });
  }

  async setFirstInteraction(relationshipId: string): Promise<Relationship> {
    return prisma.relationship.update({
      where: { id: relationshipId },
      data: { firstInteractionAt: new Date() },
    });
  }

  async pauseRelationship(relationshipId: string): Promise<Relationship> {
    return this.update(relationshipId, { status: 'PAUSED' } as any);
  }

  async resumeRelationship(relationshipId: string): Promise<Relationship> {
    return this.update(relationshipId, { status: 'ACTIVE' } as any);
  }

  async endRelationship(relationshipId: string): Promise<Relationship> {
    return this.update(relationshipId, { status: 'ENDED' } as any);
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count({ userId });
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.count({ userId, status: 'ACTIVE' });
  }

  async existsByUserIdAndCompanionId(userId: string, companionId: string): Promise<boolean> {
    return this.exists({ userId, companionId });
  }
}
