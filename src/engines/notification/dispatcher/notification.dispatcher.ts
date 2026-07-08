import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { INotificationDispatcher } from '../interfaces/notification.interfaces';
import {
  NotificationDispatchResult,
  NotificationRetryPolicy,
  ScheduledNotification,
} from '../dtos/notification-engine.dtos';
import { NotificationChannel } from '../enums/notification.enums';

/**
 * Channel transport contract. Concrete transports are wired at the factory
 * layer (APNS/FCM for PUSH, SMTP for EMAIL, WebSocket/DB write for IN_APP).
 * The dispatcher itself is transport-agnostic and only orchestrates retry
 * semantics.
 */
export interface NotificationChannelTransport {
  send(notification: ScheduledNotification): Promise<void>;
}

export const DEFAULT_RETRY_POLICY: NotificationRetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffMultiplier: 2,
  maxDelayMs: 5000,
};

/**
 * Default in-process transport. It succeeds silently — production replaces this
 * with an APNS/FCM/SMTP transport at the factory. Tests can pass a rejecting
 * transport to exercise retry semantics.
 */
class NoOpTransport implements NotificationChannelTransport {
  async send(): Promise<void> {
    return;
  }
}

export class NotificationDispatcher implements INotificationDispatcher {
  private readonly logger: Logger;
  private readonly transports: Map<NotificationChannel, NotificationChannelTransport>;
  private readonly retry: NotificationRetryPolicy;

  constructor(
    transports?: Partial<Record<NotificationChannel, NotificationChannelTransport>>,
    retry: NotificationRetryPolicy = DEFAULT_RETRY_POLICY
  ) {
    this.logger = createLogger('NotificationDispatcher');
    this.retry = retry;
    this.transports = new Map<NotificationChannel, NotificationChannelTransport>([
      [NotificationChannel.PUSH, transports?.PUSH ?? new NoOpTransport()],
      [NotificationChannel.EMAIL, transports?.EMAIL ?? new NoOpTransport()],
      [NotificationChannel.IN_APP, transports?.IN_APP ?? new NoOpTransport()],
      [NotificationChannel.SMS, transports?.SMS ?? new NoOpTransport()],
    ]);
  }

  async dispatch(
    notification: ScheduledNotification,
    channel: NotificationChannel
  ): Promise<IResult<NotificationDispatchResult>> {
    const transport = this.transports.get(channel);
    if (!transport) {
      return Result.failure(new Error(`No transport for channel ${channel}`));
    }

    let attempt = 1;
    let lastError: Error | undefined;
    while (attempt <= this.retry.maxAttempts) {
      try {
        await transport.send(notification);
        return Result.success({
          notificationId: notification.id,
          channel,
          success: true,
          attempt,
          dispatchedAt: new Date(),
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(
          { channel, notificationId: notification.id, attempt, err: lastError.message },
          'Dispatch attempt failed'
        );
        if (attempt >= this.retry.maxAttempts) break;
        await this.delay(this.backoff(attempt));
        attempt++;
      }
    }

    return Result.success({
      notificationId: notification.id,
      channel,
      success: false,
      attempt,
      error: lastError?.message,
      dispatchedAt: new Date(),
    });
  }

  private backoff(attempt: number): number {
    return Math.min(
      this.retry.maxDelayMs,
      this.retry.initialDelayMs * Math.pow(this.retry.backoffMultiplier, attempt - 1)
    );
  }

  private async delay(ms: number): Promise<void> {
    if (ms <= 0) return;
    await new Promise<void>((r) => setTimeout(r, ms));
  }
}
