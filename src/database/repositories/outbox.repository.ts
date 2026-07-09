import { Outbox, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type OutboxCreateInput = Prisma.OutboxCreateInput;
type OutboxUpdateInput = Prisma.OutboxUpdateInput;

export class OutboxRepository extends BaseRepository<Outbox, OutboxCreateInput, OutboxUpdateInput> {
  protected getDelegate() {
    return prisma.outbox;
  }

  protected getModelName(): string {
    return 'Outbox';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  /**
   * Find pending outbox entries ready to publish, ordered by creation time.
   * Used by OutboxPoller to batch-publish events.
   */
  async findPending(limit: number = 100, options?: FindManyOptions): Promise<Outbox[]> {
    return this.findMany(
      { status: 'PENDING' },
      { ...options, take: limit, orderBy: { createdAt: 'asc' } }
    );
  }

  /**
   * Find entries for a specific aggregate (e.g., all events for a relationship).
   */
  async findByAggregateId(aggregateId: string, options?: FindManyOptions): Promise<Outbox[]> {
    return this.findMany({ aggregateId }, { ...options, orderBy: { createdAt: 'asc' } });
  }

  /**
   * Mark an outbox entry as published.
   */
  async markPublished(id: string): Promise<Outbox> {
    return this.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    } as OutboxUpdateInput);
  }

  /**
   * Mark an outbox entry as failed with a reason.
   */
  async markFailed(id: string, reason: string, nextRetryAt?: Date): Promise<Outbox> {
    return this.update(id, {
      status: 'FAILED',
      failureReason: reason,
      attempts: { increment: 1 },
      lastAttemptedAt: new Date(),
      ...(nextRetryAt && { nextRetryAt }),
    } as unknown as OutboxUpdateInput);
  }

  /**
   * Count pending outbox entries.
   */
  async countPending(): Promise<number> {
    return this.count({ status: 'PENDING' });
  }

  /**
   * Archive published outbox entries older than the given date.
   * Used for periodic cleanup to keep the table bounded.
   */
  async archivePublishedBefore(date: Date): Promise<{ count: number }> {
    return this.updateMany(
      { AND: [{ status: 'PUBLISHED' }, { publishedAt: { lt: date } }] },
      { deletedAt: new Date() } as OutboxUpdateInput
    );
  }
}
