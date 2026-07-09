import Redis from 'ioredis';
import { IResult, Result } from '@services/types/result.type';
import { IMomentScheduler } from '../interfaces/moment.interfaces';
import { ScheduledMoment } from '../dtos/moment-engine.dtos';
import { MomentStatus } from '../enums/moment.enums';
import { RedisSchedulerBase } from '@engines/scheduler/redis-scheduler.base';

/**
 * Redis-backed moment scheduler with local cache.
 *
 * Hybrid approach: local in-memory cache for sync API, Redis for persistence.
 * This maintains the synchronous interface while enabling horizontal scaling.
 *
 * Redis structure:
 * - scheduler:moment (sorted set): id → scheduledFor timestamp
 * - scheduler-details:moment (hash): id → serialized moment
 */
export class RedisMomentScheduler
  extends RedisSchedulerBase<ScheduledMoment>
  implements IMomentScheduler {

  private readonly scheduled: Map<string, ScheduledMoment> = new Map();

  constructor(redisClient: Redis) {
    super(redisClient, 'moment', 'RedisMomentScheduler');
  }

  schedule(moment: ScheduledMoment): IResult<void> {
    try {
      const toSchedule = { ...moment, status: MomentStatus.SCHEDULED };
      this.scheduled.set(moment.id, toSchedule);

      this.syncToRedisAsync(toSchedule).catch((error) => {
        this.logger.error({ error, momentId: moment.id }, 'Failed to sync moment to Redis');
      });

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  cancel(momentId: string): IResult<void> {
    try {
      this.scheduled.delete(momentId);

      this.removeFromRedisAsync(momentId).catch((error) => {
        this.logger.error({ error, momentId }, 'Failed to remove moment from Redis');
      });

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  listDue(now: Date): IResult<ScheduledMoment[]> {
    try {
      const due = Array.from(this.scheduled.values()).filter(
        (m) => m.status === MomentStatus.SCHEDULED && m.scheduledFor.getTime() <= now.getTime()
      );
      return Result.success(due);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  listAll(userId?: string): IResult<ScheduledMoment[]> {
    try {
      const all = Array.from(this.scheduled.values());
      if (!userId) {
        return Result.success(all);
      }
      return Result.success(all.filter((m) => m.userId === userId));
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  markDelivered(momentId: string): IResult<void> {
    try {
      const moment = this.scheduled.get(momentId);
      if (!moment) {
        return Result.failure(new Error(`Moment ${momentId} not scheduled`));
      }

      this.scheduled.set(momentId, {
        ...moment,
        status: MomentStatus.DELIVERED,
        updatedAt: new Date(),
      });

      this.updateInRedisAsync(momentId, {
        status: MomentStatus.DELIVERED,
        updatedAt: new Date(),
      }).catch((error) => {
        this.logger.error({ error, momentId }, 'Failed to update moment in Redis');
      });

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async syncToRedisAsync(moment: ScheduledMoment): Promise<void> {
    await this.scheduleItem(moment);
  }

  private async removeFromRedisAsync(momentId: string): Promise<void> {
    await this.removeItem(momentId);
  }

  private async updateInRedisAsync(
    momentId: string,
    updates: Partial<ScheduledMoment>
  ): Promise<void> {
    await this.updateItem(momentId, updates);
  }
}
