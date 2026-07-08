import { INotificationAnalytics } from '../interfaces/notification.interfaces';
import {
  NotificationAnalyticsSnapshot,
  NotificationDispatchResult,
  ScheduledNotification,
} from '../dtos/notification-engine.dtos';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
} from '../enums/notification.enums';

const zeroCategory = (): Record<NotificationCategory, number> =>
  Object.values(NotificationCategory).reduce((acc, c) => {
    acc[c as NotificationCategory] = 0;
    return acc;
  }, {} as Record<NotificationCategory, number>);

const zeroChannel = (): Record<NotificationChannel, number> =>
  Object.values(NotificationChannel).reduce((acc, c) => {
    acc[c as NotificationChannel] = 0;
    return acc;
  }, {} as Record<NotificationChannel, number>);

export class NotificationAnalytics implements INotificationAnalytics {
  private totalScheduled = 0;
  private totalDispatched = 0;
  private totalDelivered = 0;
  private totalFailed = 0;
  private totalThrottled = 0;
  private byCategory = zeroCategory();
  private byChannel = zeroChannel();

  recordScheduled(n: ScheduledNotification): void {
    this.totalScheduled++;
    if (n.status === NotificationStatus.THROTTLED) this.totalThrottled++;
    this.byCategory[n.category] = (this.byCategory[n.category] ?? 0) + 1;
  }

  recordDispatch(result: NotificationDispatchResult, _n: ScheduledNotification): void {
    this.totalDispatched++;
    this.byChannel[result.channel] = (this.byChannel[result.channel] ?? 0) + 1;
    if (result.success) this.totalDelivered++;
    else this.totalFailed++;
  }

  snapshot(): NotificationAnalyticsSnapshot {
    return {
      totalScheduled: this.totalScheduled,
      totalDispatched: this.totalDispatched,
      totalDelivered: this.totalDelivered,
      totalFailed: this.totalFailed,
      totalThrottled: this.totalThrottled,
      byCategory: { ...this.byCategory },
      byChannel: { ...this.byChannel },
    };
  }
}
