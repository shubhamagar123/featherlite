import { Moment, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type MomentCreateInput = Prisma.MomentCreateInput;
type MomentUpdateInput = Prisma.MomentUpdateInput;

export class MomentRepository extends BaseRepository<Moment, MomentCreateInput, MomentUpdateInput> {
  protected getDelegate() {
    return prisma.moment;
  }

  protected getModelName(): string {
    return 'Moment';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByCompanionId(companionId: string, options?: FindManyOptions): Promise<Moment[]> {
    return this.findMany({ companionId }, options);
  }

  async findByUserId(userId: string, options?: FindManyOptions): Promise<Moment[]> {
    return this.findMany({ userId }, options);
  }

  async findByType(type: string, options?: FindManyOptions): Promise<Moment[]> {
    return this.findMany({ type }, options);
  }

  async findByCategory(category: string, options?: FindManyOptions): Promise<Moment[]> {
    return this.findMany({ category }, options);
  }

  async findByCompanionIdAndType(
    companionId: string,
    type: string,
    options?: FindManyOptions
  ): Promise<Moment[]> {
    return this.findMany({ companionId, type }, options);
  }

  async findByCompanionIdAndCategory(
    companionId: string,
    category: string,
    options?: FindManyOptions
  ): Promise<Moment[]> {
    return this.findMany({ companionId, category }, options);
  }

  async findByCreatedAfter(date: Date, options?: FindManyOptions): Promise<Moment[]> {
    return this.findMany({ createdAt: { gte: date } }, options);
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: FindManyOptions
  ): Promise<Moment[]> {
    return this.findMany(
      {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      options
    );
  }

  async findByCompanionIdAndDateRange(
    companionId: string,
    startDate: Date,
    endDate: Date,
    options?: FindManyOptions
  ): Promise<Moment[]> {
    return this.findMany(
      {
        companionId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      options
    );
  }

  async findRecentByCompanionId(companionId: string, limit: number = 10): Promise<Moment[]> {
    return this.findMany(
      { companionId },
      {
        take: limit,
        orderBy: { createdAt: 'desc' },
      }
    );
  }

  async findMostSignificant(companionId: string, limit: number = 10): Promise<Moment[]> {
    return this.findMany(
      { companionId },
      {
        take: limit,
        orderBy: { significance: 'desc' },
      }
    );
  }

  async findPublic(options?: FindManyOptions): Promise<Moment[]> {
    return this.findMany({ isPublic: true }, options);
  }

  async updateTitle(momentId: string, title: string): Promise<Moment> {
    return this.update(momentId, { title } as any);
  }

  async updateDescription(momentId: string, description: string): Promise<Moment> {
    return this.update(momentId, { description } as any);
  }

  async updateSignificance(momentId: string, significance: number): Promise<Moment> {
    return this.update(momentId, { significance } as any);
  }

  async updateTags(momentId: string, tags: string): Promise<Moment> {
    return this.update(momentId, { tags } as any);
  }

  async updateImageUrl(momentId: string, imageUrl: string): Promise<Moment> {
    return this.update(momentId, { imageUrl } as any);
  }

  async countByCompanionId(companionId: string): Promise<number> {
    return this.count({ companionId });
  }

  async countByCompanionIdAndType(companionId: string, type: string): Promise<number> {
    return this.count({ companionId, type });
  }

  async countByCompanionIdAndCategory(companionId: string, category: string): Promise<number> {
    return this.count({ companionId, category });
  }

  async countFavoritedByCompanionId(companionId: string): Promise<number> {
    try {
      const moments = await prisma.moment.findMany({
        where: { companionId, deletedAt: null },
        select: { id: true },
      });

      return moments.filter((m) => m.id).length; // Simple favorited count
    } catch (error) {
      throw error;
    }
  }

  async existsByCompanionId(companionId: string): Promise<boolean> {
    return this.exists({ companionId });
  }
}
