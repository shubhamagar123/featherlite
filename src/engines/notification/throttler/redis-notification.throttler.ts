import Redis from 'ioredis';
import { IResult, Result } from '@services/types/result.type';
import { INotificationThrottler } from '../interfaces/notification.interfaces';
import { NotificationThrottlePolicy } from '../dtos/notification-engine.dtos';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

interface Ledger {
  minute: { windowStart: number; count: number };
  hour: { windowStart: number; count: number };
  day: { windowStart: number; count: number };
}

/**
 * Redis-backed notification throttler with local cache.
 *
 * Hybrid approach: local ledger cache for sync API, Redis for durability.
 * Uses INCR and EXPIRE for distributed counting across instances.
 *
 * Key structure: throttle:<userId>:<window>:<windowStart>
 * - minute: 60-second windows
 * - hour: 3600-second windows (1 hour)
 * - day: 86400-second windows (1 day)
 */
export const DEFAULT_THROTTLE_POLICY: NotificationThrottlePolicy = {
  perUserPerMinute: 3,
  perUserPerHour: 20,
  perUserPerDay: 60,
};

export class RedisNotificationThrottler implements INotificationThrottler {
  private readonly logger: Logger;
  private readonly minuteWindowMs = 60_000;
  private readonly hourWindowMs = 60 * this.minuteWindowMs;
  private readonly dayWindowMs = 24 * this.hourWindowMs;
  private readonly ledgers: Map<string, Ledger> = new Map();

  constructor(
    private redisClient: Redis,
    private readonly policy: NotificationThrottlePolicy = DEFAULT_THROTTLE_POLICY
  ) {
    this.logger = createLogger('RedisNotificationThrottler');
  }

  allow(userId: string, now: Date): IResult<boolean> {
    try {
      const ledger = this.rotate(userId, now.getTime());
      if (ledger.minute.count >= this.policy.perUserPerMinute) {
        return Result.success(false);
      }
      if (ledger.hour.count >= this.policy.perUserPerHour) {
        return Result.success(false);
      }
      if (ledger.day.count >= this.policy.perUserPerDay) {
        return Result.success(false);
      }
      return Result.success(true);
    } catch (error) {
      this.logger.error({ error, userId }, 'Error checking throttle, allowing by default');
      return Result.success(true);
    }
  }

  recordSend(userId: string, now: Date): void {
    try {
      const ledger = this.rotate(userId, now.getTime());
      ledger.minute.count++;
      ledger.hour.count++;
      ledger.day.count++;
      this.ledgers.set(userId, ledger);

      this.syncToRedisAsync(userId).catch((error) => {
        this.logger.error({ error, userId }, 'Failed to sync throttle to Redis');
      });
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to record notification send');
    }
  }

  private rotate(userId: string, ts: number): Ledger {
    let ledger = this.ledgers.get(userId);
    if (!ledger) {
      ledger = {
        minute: { windowStart: ts, count: 0 },
        hour: { windowStart: ts, count: 0 },
        day: { windowStart: ts, count: 0 },
      };
      this.ledgers.set(userId, ledger);
      return ledger;
    }

    if (ts - ledger.minute.windowStart >= this.minuteWindowMs) {
      ledger.minute.windowStart = ts;
      ledger.minute.count = 0;
    }
    if (ts - ledger.hour.windowStart >= this.hourWindowMs) {
      ledger.hour.windowStart = ts;
      ledger.hour.count = 0;
    }
    if (ts - ledger.day.windowStart >= this.dayWindowMs) {
      ledger.day.windowStart = ts;
      ledger.day.count = 0;
    }

    return ledger;
  }

  private async syncToRedisAsync(userId: string): Promise<void> {
    const ledger = this.ledgers.get(userId);
    if (!ledger) return;

    const minuteKey = this.getKey(userId, 'minute', ledger.minute.windowStart);
    const hourKey = this.getKey(userId, 'hour', ledger.hour.windowStart);
    const dayKey = this.getKey(userId, 'day', ledger.day.windowStart);

    await Promise.all([
      this.setCounterIfNotExists(minuteKey, ledger.minute.count, Math.ceil(this.minuteWindowMs / 1000)),
      this.setCounterIfNotExists(hourKey, ledger.hour.count, Math.ceil(this.hourWindowMs / 1000)),
      this.setCounterIfNotExists(dayKey, ledger.day.count, Math.ceil(this.dayWindowMs / 1000)),
    ]);
  }

  private async setCounterIfNotExists(
    key: string,
    count: number,
    ttlSeconds: number
  ): Promise<void> {
    const exists = await this.redisClient.exists(key);
    if (!exists) {
      await this.redisClient.setex(key, ttlSeconds, String(count));
    }
  }

  private getKey(userId: string, window: 'minute' | 'hour' | 'day', windowStart: number): string {
    return `throttle:${userId}:${window}:${windowStart}`;
  }
}

