import {
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationTemplateId,
} from '../enums/notification.enums';

export interface NotificationRequest {
  userId: string;
  companionId?: string;
  category: NotificationCategory;
  templateId: NotificationTemplateId;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  scheduledFor?: Date;
  data: Record<string, unknown>;
  ttlMs?: number;
  dedupeKey?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  data: Record<string, unknown>;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  companionId?: string;
  category: NotificationCategory;
  templateId: NotificationTemplateId;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  status: NotificationStatus;
  payload: NotificationPayload;
  scheduledFor: Date;
  expiresAt?: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
  dedupeKey?: string;
  lastError?: string;
}

export interface NotificationDispatchResult {
  notificationId: string;
  channel: NotificationChannel;
  success: boolean;
  attempt: number;
  error?: string;
  dispatchedAt: Date;
}

export interface NotificationTemplateData {
  id: NotificationTemplateId;
  titleTemplate: string;
  bodyTemplate: string;
  defaultCategory: NotificationCategory;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
}

export interface NotificationThrottlePolicy {
  perUserPerMinute: number;
  perUserPerHour: number;
  perUserPerDay: number;
}

export interface NotificationRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export interface NotificationAnalyticsSnapshot {
  totalScheduled: number;
  totalDispatched: number;
  totalDelivered: number;
  totalFailed: number;
  totalThrottled: number;
  byCategory: Record<NotificationCategory, number>;
  byChannel: Record<NotificationChannel, number>;
}
