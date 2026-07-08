import { IResult } from '@services/types/result.type';
import {
  NotificationRequest,
  NotificationPayload,
  ScheduledNotification,
  NotificationDispatchResult,
  NotificationAnalyticsSnapshot,
  NotificationTemplateData,
} from '../dtos/notification-engine.dtos';
import { NotificationChannel, NotificationTemplateId } from '../enums/notification.enums';

export interface INotificationBuilder {
  build(request: NotificationRequest): IResult<NotificationPayload>;
}

export interface INotificationScheduler {
  schedule(notification: ScheduledNotification): IResult<void>;
  cancel(notificationId: string): IResult<void>;
  listDue(now: Date): IResult<ScheduledNotification[]>;
  listByUser(userId: string): IResult<ScheduledNotification[]>;
  markStatus(notificationId: string, status: string, error?: string): IResult<void>;
}

export interface INotificationDispatcher {
  dispatch(notification: ScheduledNotification, channel: NotificationChannel): Promise<IResult<NotificationDispatchResult>>;
}

export interface INotificationThrottler {
  allow(userId: string, now: Date): IResult<boolean>;
  recordSend(userId: string, now: Date): void;
}

export interface INotificationAnalytics {
  recordScheduled(n: ScheduledNotification): void;
  recordDispatch(result: NotificationDispatchResult, n: ScheduledNotification): void;
  snapshot(): NotificationAnalyticsSnapshot;
}

export interface INotificationTemplateRegistry {
  get(id: NotificationTemplateId): NotificationTemplateData | null;
  register(template: NotificationTemplateData): void;
  all(): NotificationTemplateData[];
}

export interface INotificationEngine {
  scheduleNotification(request: NotificationRequest): Promise<IResult<ScheduledNotification>>;
  dispatchDue(now?: Date): Promise<IResult<NotificationDispatchResult[]>>;
  cancelNotification(notificationId: string): IResult<void>;
  getAnalytics(): NotificationAnalyticsSnapshot;
}
