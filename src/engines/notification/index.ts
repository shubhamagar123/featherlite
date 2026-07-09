export { NotificationEngine } from './notification.engine';
export {
  getNotificationEngine,
  resetNotificationEngine,
} from './notification.factory';
export type { NotificationEngineFactoryDeps } from './notification.factory';
export type { NotificationEngineDeps } from './notification.engine';

export type {
  INotificationEngine,
  INotificationBuilder,
  INotificationScheduler,
  INotificationDispatcher,
  INotificationThrottler,
  INotificationAnalytics,
  INotificationTemplateRegistry,
} from './interfaces/notification.interfaces';

export { NotificationBuilder } from './builder/notification.builder';
export {
  NotificationDispatcher,
  DEFAULT_RETRY_POLICY,
} from './dispatcher/notification.dispatcher';
export type { NotificationChannelTransport } from './dispatcher/notification.dispatcher';
export { NotificationAnalytics } from './analytics/notification.analytics';
export {
  NotificationTemplateRegistry,
  DEFAULT_NOTIFICATION_TEMPLATES,
} from './templates/notification.templates';
export { NotificationRules } from './rules/notification.rules';
export { MomentTriggeredHandler } from './handlers/moment-triggered.handler';

export type {
  NotificationRequest,
  NotificationPayload,
  ScheduledNotification,
  NotificationDispatchResult,
  NotificationTemplateData,
  NotificationThrottlePolicy,
  NotificationRetryPolicy,
  NotificationAnalyticsSnapshot,
} from './dtos/notification-engine.dtos';

export {
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationTemplateId,
} from './enums/notification.enums';
