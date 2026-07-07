import { Notification, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type NotificationCreateInput = Prisma.NotificationCreateInput;
type NotificationUpdateInput = Prisma.NotificationUpdateInput;

export class NotificationRepository extends BaseRepository<
  Notification,
  NotificationCreateInput,
  NotificationUpdateInput
> {
  protected getDelegate() {
    return prisma.notification;
  }

  protected getModelName(): string {
    return 'Notification';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByUserId(userId: string, options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ userId }, options);
  }

  async findByCompanionId(companionId: string, options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ companionId }, options);
  }

  async findByType(type: string, options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ type }, options);
  }

  async findByChannel(channel: string, options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ channel }, options);
  }

  async findByStatus(status: string, options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ status }, options);
  }

  async findUnread(options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ status: 'UNREAD' }, options);
  }

  async findRead(options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ status: 'READ' }, options);
  }

  async findByUserIdAndStatus(userId: string, status: string, options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ userId, status }, options);
  }

  async findUnreadByUserId(userId: string, options?: FindManyOptions): Promise<Notification[]> {
    return this.findByUserIdAndStatus(userId, 'UNREAD', options);
  }

  async findByCreatedAfter(date: Date, options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ createdAt: { gte: date } }, options);
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: FindManyOptions
  ): Promise<Notification[]> {
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

  async findRecentByUserId(userId: string, limit: number = 10): Promise<Notification[]> {
    return this.findMany(
      { userId },
      {
        take: limit,
        orderBy: { createdAt: 'desc' },
      }
    );
  }

  async findRecentUnreadByUserId(userId: string, limit: number = 10): Promise<Notification[]> {
    return this.findMany(
      { userId, status: 'UNREAD' },
      {
        take: limit,
        orderBy: { createdAt: 'desc' },
      }
    );
  }

  async findByUserIdAndType(userId: string, type: string, options?: FindManyOptions): Promise<Notification[]> {
    return this.findMany({ userId, type }, options);
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    return this.update(notificationId, { status: 'READ', readAt: new Date() } as any);
  }

  async markAsUnread(notificationId: string): Promise<Notification> {
    return this.update(notificationId, { status: 'UNREAD' } as any);
  }

  async markMultipleAsRead(notificationIds: string[]): Promise<Prisma.BatchPayload> {
    return this.updateMany(
      { id: { in: notificationIds } },
      { status: 'READ', readAt: new Date() } as any
    );
  }

  async markAllAsReadByUserId(userId: string): Promise<Prisma.BatchPayload> {
    return this.updateMany(
      { userId, status: 'UNREAD' },
      { status: 'READ', readAt: new Date() } as any
    );
  }

  async updateContent(notificationId: string, title: string, message: string): Promise<Notification> {
    return this.update(notificationId, { title, message } as any);
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count({ userId });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.count({ userId, status: 'UNREAD' });
  }

  async countByUserIdAndType(userId: string, type: string): Promise<number> {
    return this.count({ userId, type });
  }

  async countByUserIdAndChannel(userId: string, channel: string): Promise<number> {
    return this.count({ userId, channel });
  }

  async existsByUserId(userId: string): Promise<boolean> {
    return this.exists({ userId });
  }

  async existsUnreadByUserId(userId: string): Promise<boolean> {
    return this.exists({ userId, status: 'UNREAD' });
  }

  async findOlderThan(days: number, options?: FindManyOptions): Promise<Notification[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.findMany(
      {
        createdAt: { lt: cutoffDate },
      },
      options
    );
  }

  async deleteOlderThan(days: number): Promise<Prisma.BatchPayload> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.hardDeleteMany({
      createdAt: { lt: cutoffDate },
    });
  }
}
