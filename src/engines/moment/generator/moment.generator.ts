import { IResult, Result } from '@services/types/result.type';
import { randomUUID } from 'crypto';
import { IMomentGenerator } from '../interfaces/moment.interfaces';
import {
  MomentCandidate,
  ScheduledMoment,
  MomentGenerationOptions,
} from '../dtos/moment-engine.dtos';
import { MomentStatus } from '../enums/moment.enums';
import { MomentRules } from '../rules/moment.rules';

/**
 * Turns a MomentCandidate into a ScheduledMoment ready for the scheduler.
 * Delegates all persistence to the caller (the engine writes through
 * MomentService when the moment is materialized as a domain record).
 */
export class MomentGenerator implements IMomentGenerator {
  private readonly rules = new MomentRules();

  async generate(
    candidate: MomentCandidate,
    opts: MomentGenerationOptions = {}
  ): Promise<IResult<ScheduledMoment>> {
    return Result.tryAsync(async () => {
      const now = new Date();
      const delayMs = opts.scheduleDelayMs ?? this.rules.defaultDelayForKind(candidate.kind);
      const scheduledFor = candidate.suggestedOccurAt ?? new Date(now.getTime() + delayMs);
      const moment: ScheduledMoment = {
        id: candidate.id ?? `mom_${randomUUID()}`,
        userId: candidate.userId,
        companionId: candidate.companionId,
        kind: candidate.kind,
        significance: opts.significance ?? candidate.significance,
        status: MomentStatus.DRAFT,
        title: candidate.title,
        description: candidate.description,
        scheduledFor,
        createdAt: now,
        updatedAt: now,
        data: candidate.data,
      };
      return moment;
    });
  }
}
