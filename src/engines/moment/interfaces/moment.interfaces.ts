import { IResult } from '@services/types/result.type';
import {
  MomentCandidate,
  ScheduledMoment,
  MomentEvaluationInput,
  MomentEvaluationResult,
  MomentGenerationOptions,
} from '../dtos/moment-engine.dtos';

export interface IMomentEvaluator {
  evaluate(input: MomentEvaluationInput): IResult<MomentEvaluationResult>;
}

export interface IMomentGenerator {
  generate(candidate: MomentCandidate, opts?: MomentGenerationOptions): Promise<IResult<ScheduledMoment>>;
}

export interface IMomentScheduler {
  schedule(moment: ScheduledMoment): IResult<void>;
  cancel(momentId: string): IResult<void>;
  listDue(now: Date): IResult<ScheduledMoment[]>;
  listAll(userId?: string): IResult<ScheduledMoment[]>;
  markDelivered(momentId: string): IResult<void>;
}

export interface IMomentEngine {
  processEvent(input: MomentEvaluationInput): Promise<IResult<ScheduledMoment[]>>;
  scheduleAnniversary(userId: string, companionId: string, anniversaryDate: Date, title: string): Promise<IResult<ScheduledMoment>>;
  scheduleCallback(userId: string, companionId: string, delayMs: number, title: string, data?: Record<string, unknown>): Promise<IResult<ScheduledMoment>>;
  scheduleReminder(userId: string, companionId: string, remindAt: Date, title: string, data?: Record<string, unknown>): Promise<IResult<ScheduledMoment>>;
  scheduleFollowUp(userId: string, companionId: string, delayMs: number, title: string, data?: Record<string, unknown>): Promise<IResult<ScheduledMoment>>;
  dueMoments(now?: Date): IResult<ScheduledMoment[]>;
  markDelivered(momentId: string): IResult<void>;
}
