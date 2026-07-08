import { IResult, Result } from '@services/types/result.type';
import { IMomentScheduler } from '../interfaces/moment.interfaces';
import { ScheduledMoment } from '../dtos/moment-engine.dtos';
import { MomentStatus } from '../enums/moment.enums';

export class MomentScheduler implements IMomentScheduler {
  private scheduled: Map<string, ScheduledMoment> = new Map();

  schedule(moment: ScheduledMoment): IResult<void> {
    this.scheduled.set(moment.id, { ...moment, status: MomentStatus.SCHEDULED });
    return Result.success(undefined);
  }

  cancel(momentId: string): IResult<void> {
    this.scheduled.delete(momentId);
    return Result.success(undefined);
  }

  listDue(now: Date): IResult<ScheduledMoment[]> {
    const due = Array.from(this.scheduled.values()).filter(
      (m) => m.status === MomentStatus.SCHEDULED && m.scheduledFor.getTime() <= now.getTime()
    );
    return Result.success(due);
  }

  listAll(userId?: string): IResult<ScheduledMoment[]> {
    const all = Array.from(this.scheduled.values());
    if (!userId) return Result.success(all);
    return Result.success(all.filter((m) => m.userId === userId));
  }

  markDelivered(momentId: string): IResult<void> {
    const moment = this.scheduled.get(momentId);
    if (!moment) return Result.failure(new Error(`Moment ${momentId} not scheduled`));
    this.scheduled.set(momentId, { ...moment, status: MomentStatus.DELIVERED, updatedAt: new Date() });
    return Result.success(undefined);
  }
}
