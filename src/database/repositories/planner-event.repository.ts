import { PlannerEvent, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type PlannerEventCreateInput = Prisma.PlannerEventCreateInput;
type PlannerEventUpdateInput = Prisma.PlannerEventUpdateInput;

export class PlannerEventRepository extends BaseRepository<
  PlannerEvent,
  PlannerEventCreateInput,
  PlannerEventUpdateInput
> {
  protected getDelegate() {
    return prisma.plannerEvent;
  }

  protected getModelName(): string {
    return 'PlannerEvent';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByUserId(userId: string, options?: FindManyOptions): Promise<PlannerEvent[]> {
    return this.findMany({ userId }, options);
  }

  async findByUserIdAndCompanionId(
    userId: string,
    companionId: string,
    options?: FindManyOptions
  ): Promise<PlannerEvent[]> {
    return this.findMany({ userId, companionId }, options);
  }

  async findUpcomingByUserId(userId: string, after: Date, options?: FindManyOptions): Promise<PlannerEvent[]> {
    return this.findMany(
      { userId, status: 'SCHEDULED', scheduledFor: { gte: after } },
      { orderBy: { scheduledFor: 'asc' }, ...options }
    );
  }
}
