import { IResult, Result } from '@services/types/result.type';
import { INotificationThrottler } from '../interfaces/notification.interfaces';
import { NotificationThrottlePolicy } from '../dtos/notification-engine.dtos';

interface Ledger {
  minute: { windowStart: number; count: number };
  hour: { windowStart: number; count: number };
  day: { windowStart: number; count: number };
}

export const DEFAULT_THROTTLE_POLICY: NotificationThrottlePolicy = {
  perUserPerMinute: 3,
  perUserPerHour: 20,
  perUserPerDay: 60,
};

export class NotificationThrottler implements INotificationThrottler {
  private ledgers: Map<string, Ledger> = new Map();

  constructor(private readonly policy: NotificationThrottlePolicy = DEFAULT_THROTTLE_POLICY) {}

  allow(userId: string, now: Date): IResult<boolean> {
    const ledger = this.rotate(userId, now.getTime());
    if (ledger.minute.count >= this.policy.perUserPerMinute) return Result.success(false);
    if (ledger.hour.count >= this.policy.perUserPerHour) return Result.success(false);
    if (ledger.day.count >= this.policy.perUserPerDay) return Result.success(false);
    return Result.success(true);
  }

  recordSend(userId: string, now: Date): void {
    const ledger = this.rotate(userId, now.getTime());
    ledger.minute.count++;
    ledger.hour.count++;
    ledger.day.count++;
    this.ledgers.set(userId, ledger);
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

    const minuteMs = 60_000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    if (ts - ledger.minute.windowStart >= minuteMs) {
      ledger.minute.windowStart = ts;
      ledger.minute.count = 0;
    }
    if (ts - ledger.hour.windowStart >= hourMs) {
      ledger.hour.windowStart = ts;
      ledger.hour.count = 0;
    }
    if (ts - ledger.day.windowStart >= dayMs) {
      ledger.day.windowStart = ts;
      ledger.day.count = 0;
    }

    return ledger;
  }
}
