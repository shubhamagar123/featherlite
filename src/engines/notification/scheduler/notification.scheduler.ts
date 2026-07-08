import { IResult, Result } from '@services/types/result.type';
import { INotificationScheduler } from '../interfaces/notification.interfaces';
import { ScheduledNotification } from '../dtos/notification-engine.dtos';
import { NotificationStatus } from '../enums/notification.enums';

export class NotificationScheduler implements INotificationScheduler {
  private byId: Map<string, ScheduledNotification> = new Map();
  private byDedupe: Map<string, string> = new Map();

  schedule(notification: ScheduledNotification): IResult<void> {
    if (notification.dedupeKey) {
      const existing = this.byDedupe.get(notification.dedupeKey);
      if (existing && this.byId.has(existing)) {
        return Result.success(undefined);
      }
      this.byDedupe.set(notification.dedupeKey, notification.id);
    }
    this.byId.set(notification.id, { ...notification, status: NotificationStatus.SCHEDULED });
    return Result.success(undefined);
  }

  cancel(notificationId: string): IResult<void> {
    const existing = this.byId.get(notificationId);
    if (existing) {
      this.byId.set(notificationId, {
        ...existing,
        status: NotificationStatus.CANCELLED,
        updatedAt: new Date(),
      });
    }
    return Result.success(undefined);
  }

  listDue(now: Date): IResult<ScheduledNotification[]> {
    const due = Array.from(this.byId.values()).filter(
      (n) =>
        n.status === NotificationStatus.SCHEDULED && n.scheduledFor.getTime() <= now.getTime()
    );
    return Result.success(due);
  }

  listByUser(userId: string): IResult<ScheduledNotification[]> {
    return Result.success(
      Array.from(this.byId.values()).filter((n) => n.userId === userId)
    );
  }

  markStatus(notificationId: string, status: string, error?: string): IResult<void> {
    const existing = this.byId.get(notificationId);
    if (!existing) return Result.failure(new Error(`Notification ${notificationId} not found`));
    this.byId.set(notificationId, {
      ...existing,
      status: status as NotificationStatus,
      lastError: error,
      updatedAt: new Date(),
    });
    return Result.success(undefined);
  }
}
