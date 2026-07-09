import Redis from 'ioredis';
import { IResult, Result } from '@services/types/result.type';
import { INotificationScheduler } from '../interfaces/notification.interfaces';
import { ScheduledNotification } from '../dtos/notification-engine.dtos';
import { NotificationStatus } from '../enums/notification.enums';
import { RedisSchedulerBase } from '@engines/scheduler/redis-scheduler.base';

/**
 * Redis-backed notification scheduler with local cache.
 *
 * Hybrid approach: local in-memory cache for sync API, Redis for persistence.
 * This maintains the synchronous interface while enabling horizontal scaling.
 *
 * Redis structure:
 * - scheduler:notification (sorted set): id → scheduledFor timestamp
 * - scheduler-details:notification (hash): id → serialized notification
 * - scheduler-dedupe:notification (hash): dedupeKey → id
 */
export class RedisNotificationScheduler
  extends RedisSchedulerBase<ScheduledNotification>
  implements INotificationScheduler {

  private readonly dedupeHashKey: string;
  private readonly byId: Map<string, ScheduledNotification> = new Map();
  private readonly byDedupe: Map<string, string> = new Map();

  constructor(redisClient: Redis) {
    super(redisClient, 'notification', 'RedisNotificationScheduler');
    this.dedupeHashKey = 'scheduler-dedupe:notification';
  }

  schedule(notification: ScheduledNotification): IResult<void> {
    try {
      if (notification.dedupeKey) {
        const existing = this.byDedupe.get(notification.dedupeKey);
        if (existing && this.byId.has(existing)) {
          const existingNotif = this.byId.get(existing)!;
          if (existingNotif.status === NotificationStatus.SCHEDULED) {
            return Result.success(undefined);
          }
        }
        this.byDedupe.set(notification.dedupeKey, notification.id);
      }

      const toSchedule = { ...notification, status: NotificationStatus.SCHEDULED };
      this.byId.set(notification.id, toSchedule);

      this.syncToRedisAsync(notification).catch((error) => {
        this.logger.error({ error, notificationId: notification.id }, 'Failed to sync notification to Redis');
      });

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  cancel(notificationId: string): IResult<void> {
    try {
      const existing = this.byId.get(notificationId);
      if (existing) {
        this.byId.set(notificationId, {
          ...existing,
          status: NotificationStatus.CANCELLED,
          updatedAt: new Date(),
        });

        this.updateInRedisAsync(notificationId, {
          status: NotificationStatus.CANCELLED,
          updatedAt: new Date(),
        }).catch((error) => {
          this.logger.error({ error, notificationId }, 'Failed to update notification in Redis');
        });
      }
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  listDue(now: Date): IResult<ScheduledNotification[]> {
    try {
      const due = Array.from(this.byId.values()).filter(
        (n) => n.status === NotificationStatus.SCHEDULED && n.scheduledFor.getTime() <= now.getTime()
      );
      return Result.success(due);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  listByUser(userId: string): IResult<ScheduledNotification[]> {
    try {
      const items = Array.from(this.byId.values()).filter((n) => n.userId === userId);
      return Result.success(items);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  markStatus(notificationId: string, status: string, error?: string): IResult<void> {
    try {
      const existing = this.byId.get(notificationId);
      if (!existing) {
        return Result.failure(new Error(`Notification ${notificationId} not found`));
      }

      this.byId.set(notificationId, {
        ...existing,
        status: status as NotificationStatus,
        lastError: error,
        updatedAt: new Date(),
      });

      this.updateInRedisAsync(notificationId, {
        status: status as NotificationStatus,
        lastError: error,
        updatedAt: new Date(),
      }).catch((error) => {
        this.logger.error({ error, notificationId }, 'Failed to update notification status in Redis');
      });

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async syncToRedisAsync(notification: ScheduledNotification): Promise<void> {
    if (notification.dedupeKey) {
      await this.redisClient.hset(this.dedupeHashKey, notification.dedupeKey, notification.id);
    }
    await this.scheduleItem(notification);
  }

  private async updateInRedisAsync(
    notificationId: string,
    updates: Partial<ScheduledNotification>
  ): Promise<void> {
    await this.updateItem(notificationId, updates);
  }
}
