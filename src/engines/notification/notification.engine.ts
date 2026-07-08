import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { randomUUID } from 'crypto';
import {
  INotificationEngine,
  INotificationBuilder,
  INotificationScheduler,
  INotificationDispatcher,
  INotificationThrottler,
  INotificationAnalytics,
  INotificationTemplateRegistry,
} from './interfaces/notification.interfaces';
import {
  NotificationRequest,
  ScheduledNotification,
  NotificationDispatchResult,
  NotificationAnalyticsSnapshot,
} from './dtos/notification-engine.dtos';
import {
  NotificationStatus,
  NotificationChannel,
} from './enums/notification.enums';
import { NotificationBuilder } from './builder/notification.builder';
import { NotificationScheduler } from './scheduler/notification.scheduler';
import { NotificationDispatcher } from './dispatcher/notification.dispatcher';
import { NotificationThrottler } from './throttler/notification.throttler';
import { NotificationAnalytics } from './analytics/notification.analytics';
import { NotificationTemplateRegistry } from './templates/notification.templates';
import { NotificationRules } from './rules/notification.rules';
import { MomentTriggeredHandler } from './handlers/moment-triggered.handler';
import { EventEngine, EventType } from '@engines/event';
import type { INotificationService } from '@services/notification/notification.service.interface';

export interface NotificationEngineDeps {
  templates?: INotificationTemplateRegistry;
  builder?: INotificationBuilder;
  scheduler?: INotificationScheduler;
  dispatcher?: INotificationDispatcher;
  throttler?: INotificationThrottler;
  analytics?: INotificationAnalytics;
  rules?: NotificationRules;
  eventEngine?: EventEngine;
  notificationService?: INotificationService;
}

export class NotificationEngine implements INotificationEngine {
  private readonly logger: Logger;
  private readonly templates: INotificationTemplateRegistry;
  private readonly builder: INotificationBuilder;
  private readonly scheduler: INotificationScheduler;
  private readonly dispatcher: INotificationDispatcher;
  private readonly throttler: INotificationThrottler;
  private readonly analytics: INotificationAnalytics;
  private readonly rules: NotificationRules;
  private readonly eventEngine?: EventEngine;
  private readonly notificationService?: INotificationService;

  constructor(deps: NotificationEngineDeps = {}) {
    this.logger = createLogger('NotificationEngine');
    this.templates = deps.templates ?? new NotificationTemplateRegistry();
    this.builder = deps.builder ?? new NotificationBuilder(this.templates);
    this.scheduler = deps.scheduler ?? new NotificationScheduler();
    this.dispatcher = deps.dispatcher ?? new NotificationDispatcher();
    this.throttler = deps.throttler ?? new NotificationThrottler();
    this.analytics = deps.analytics ?? new NotificationAnalytics();
    this.rules = deps.rules ?? new NotificationRules();
    this.eventEngine = deps.eventEngine;
    this.notificationService = deps.notificationService;

    if (this.eventEngine) {
      const handler = new MomentTriggeredHandler(this);
      this.eventEngine.subscribe(EventType.MOMENT_TRIGGERED, handler as any);
    }
  }

  async scheduleNotification(request: NotificationRequest): Promise<IResult<ScheduledNotification>> {
    const now = new Date();
    const allowed = this.throttler.allow(request.userId, now);
    if (!allowed.isSuccess) {
      return Result.failure(allowed.error ?? new Error('Throttle check failed'));
    }

    const payload = this.builder.build(request);
    if (!payload.isSuccess || !payload.value) {
      return Result.failure(payload.error ?? new Error('Failed to build payload'));
    }

    const ttlMs = request.ttlMs ?? this.rules.categoryDefaultTTL(request.category);
    const scheduledFor = request.scheduledFor ?? now;

    const notification: ScheduledNotification = {
      id: `notif_${randomUUID()}`,
      userId: request.userId,
      companionId: request.companionId,
      category: request.category,
      templateId: request.templateId,
      channels: request.channels.length > 0 ? request.channels : [NotificationChannel.PUSH],
      priority: request.priority,
      status: allowed.value ? NotificationStatus.SCHEDULED : NotificationStatus.THROTTLED,
      payload: payload.value,
      scheduledFor,
      expiresAt: new Date(now.getTime() + ttlMs),
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      dedupeKey: request.dedupeKey,
    };

    if (allowed.value) {
      const scheduled = this.scheduler.schedule(notification);
      if (!scheduled.isSuccess) {
        return Result.failure(scheduled.error ?? new Error('Failed to schedule'));
      }
      this.analytics.recordScheduled(notification);
    } else {
      this.analytics.recordScheduled(notification);
      this.logger.info({ userId: request.userId }, 'Notification throttled');
    }

    return Result.success(notification);
  }

  async dispatchDue(now: Date = new Date()): Promise<IResult<NotificationDispatchResult[]>> {
    const due = this.scheduler.listDue(now);
    if (!due.isSuccess || !due.value) {
      return Result.failure(due.error ?? new Error('listDue failed'));
    }

    const results: NotificationDispatchResult[] = [];
    for (const notification of due.value) {
      if (notification.expiresAt && notification.expiresAt.getTime() < now.getTime()) {
        this.scheduler.markStatus(notification.id, NotificationStatus.FAILED, 'expired');
        continue;
      }

      const canSend = this.throttler.allow(notification.userId, now);
      if (canSend.isSuccess && !canSend.value) {
        this.scheduler.markStatus(notification.id, NotificationStatus.THROTTLED, 'rate limit');
        continue;
      }

      let anySuccess = false;
      let lastError: string | undefined;
      for (const channel of notification.channels) {
        const dispatched = await this.dispatcher.dispatch(notification, channel);
        if (dispatched.isSuccess && dispatched.value) {
          results.push(dispatched.value);
          this.analytics.recordDispatch(dispatched.value, notification);
          anySuccess ||= dispatched.value.success;
          if (!dispatched.value.success) lastError = dispatched.value.error;
        }
      }

      const finalStatus = anySuccess ? NotificationStatus.DELIVERED : NotificationStatus.FAILED;
      this.scheduler.markStatus(notification.id, finalStatus, lastError);

      if (anySuccess) {
        this.throttler.recordSend(notification.userId, now);
        if (this.notificationService) {
          this.notificationService
            .createNotification({
              userId: notification.userId,
              companionId: notification.companionId,
              type: notification.category,
              channel: notification.channels[0],
              title: notification.payload.title,
              message: notification.payload.body,
            })
            .catch((err) => this.logger.warn({ err }, 'NotificationService persistence failed'));
        }
      }
    }

    return Result.success(results);
  }

  cancelNotification(notificationId: string): IResult<void> {
    return this.scheduler.cancel(notificationId);
  }

  getAnalytics(): NotificationAnalyticsSnapshot {
    return this.analytics.snapshot();
  }
}
