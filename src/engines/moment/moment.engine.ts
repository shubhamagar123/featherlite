import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { IMomentEngine, IMomentEvaluator, IMomentScheduler, IMomentGenerator } from './interfaces/moment.interfaces';
import {
  MomentEvaluationInput,
  MomentCandidate,
  ScheduledMoment,
} from './dtos/moment-engine.dtos';
import {
  MomentKind,
  MomentTrigger,
  MomentSignificance,
  MomentStatus,
} from './enums/moment.enums';
import { MomentEvaluator } from './evaluator/moment.evaluator';
import { MomentGenerator } from './generator/moment.generator';
import { MomentScheduler } from './scheduler/moment.scheduler';
import { MomentRules } from './rules/moment.rules';
import { MomentTriggeredEvent } from './events/moment-scheduled.event';
import { EventEngine, EventDispatchMode, EventType } from '@engines/event';
import type { IMomentService } from '@services/moment/moment.service.interface';
import { MomentSourceEventHandler } from './handlers/moment-source-event.handler';

export interface MomentEngineDeps {
  evaluator?: IMomentEvaluator;
  generator?: IMomentGenerator;
  scheduler?: IMomentScheduler;
  rules?: MomentRules;
  eventEngine?: EventEngine;
  momentService?: IMomentService;
}

const EVENT_TYPES_OF_INTEREST: EventType[] = [
  EventType.MEMORY_CREATED,
  EventType.RELATIONSHIP_UPDATED,
  EventType.RELATIONSHIP_DIMENSION_CHANGED,
  EventType.CONVERSATION_ENDED,
  EventType.MESSAGE_SENT,
];

export class MomentEngine implements IMomentEngine {
  private readonly logger: Logger;
  private readonly evaluator: IMomentEvaluator;
  private readonly generator: IMomentGenerator;
  private readonly scheduler: IMomentScheduler;
  private readonly rules: MomentRules;
  private readonly eventEngine?: EventEngine;
  private readonly momentService?: IMomentService;

  constructor(deps: MomentEngineDeps = {}) {
    this.logger = createLogger('MomentEngine');
    this.evaluator = deps.evaluator ?? new MomentEvaluator();
    this.generator = deps.generator ?? new MomentGenerator();
    this.scheduler = deps.scheduler ?? new MomentScheduler();
    this.rules = deps.rules ?? new MomentRules();
    this.eventEngine = deps.eventEngine;
    this.momentService = deps.momentService;

    if (this.eventEngine) this.subscribe();
  }

  async processEvent(input: MomentEvaluationInput): Promise<IResult<ScheduledMoment[]>> {
    const evaluation = this.evaluator.evaluate(input);
    if (!evaluation.isSuccess || !evaluation.value) {
      return Result.failure(evaluation.error ?? new Error('Evaluation failed'));
    }

    const scheduled: ScheduledMoment[] = [];
    for (const candidate of evaluation.value.candidates) {
      const materialized = await this.materialize(candidate);
      if (materialized.isSuccess && materialized.value) scheduled.push(materialized.value);
    }
    return Result.success(scheduled);
  }

  async scheduleAnniversary(
    userId: string,
    companionId: string,
    anniversaryDate: Date,
    title: string
  ): Promise<IResult<ScheduledMoment>> {
    return this.materialize({
      userId,
      companionId,
      kind: MomentKind.ANNIVERSARY,
      trigger: MomentTrigger.SCHEDULE_ELAPSED,
      significance: MomentSignificance.MILESTONE,
      title,
      suggestedOccurAt: anniversaryDate,
    });
  }

  async scheduleCallback(
    userId: string,
    companionId: string,
    delayMs: number,
    title: string,
    data?: Record<string, unknown>
  ): Promise<IResult<ScheduledMoment>> {
    return this.materialize(
      {
        userId,
        companionId,
        kind: MomentKind.CALLBACK,
        trigger: MomentTrigger.MANUAL,
        significance: MomentSignificance.MEDIUM,
        title,
        data,
      },
      delayMs
    );
  }

  async scheduleReminder(
    userId: string,
    companionId: string,
    remindAt: Date,
    title: string,
    data?: Record<string, unknown>
  ): Promise<IResult<ScheduledMoment>> {
    return this.materialize({
      userId,
      companionId,
      kind: MomentKind.REMINDER,
      trigger: MomentTrigger.SCHEDULE_ELAPSED,
      significance: MomentSignificance.MEDIUM,
      title,
      suggestedOccurAt: remindAt,
      data,
    });
  }

  async scheduleFollowUp(
    userId: string,
    companionId: string,
    delayMs: number,
    title: string,
    data?: Record<string, unknown>
  ): Promise<IResult<ScheduledMoment>> {
    return this.materialize(
      {
        userId,
        companionId,
        kind: MomentKind.FOLLOW_UP,
        trigger: MomentTrigger.MANUAL,
        significance: MomentSignificance.MEDIUM,
        title,
        data,
      },
      delayMs
    );
  }

  dueMoments(now: Date = new Date()): IResult<ScheduledMoment[]> {
    return this.scheduler.listDue(now);
  }

  markDelivered(momentId: string): IResult<void> {
    return this.scheduler.markDelivered(momentId);
  }

  private async materialize(
    candidate: MomentCandidate,
    delayOverrideMs?: number
  ): Promise<IResult<ScheduledMoment>> {
    const generated = await this.generator.generate(candidate, {
      scheduleDelayMs: delayOverrideMs,
    });
    if (!generated.isSuccess || !generated.value) {
      return Result.failure(generated.error ?? new Error('Generator failed'));
    }

    const moment: ScheduledMoment = {
      ...generated.value,
      status: MomentStatus.SCHEDULED,
    };

    const scheduleResult = this.scheduler.schedule(moment);
    if (!scheduleResult.isSuccess) {
      return Result.failure(scheduleResult.error ?? new Error('Scheduler failed'));
    }

    if (this.momentService) {
      // Persist through the existing service. Fire-and-log — engine remains
      // the source of truth for scheduling, service is the durable projection.
      this.momentService
        .createMoment({
          userId: moment.userId,
          companionId: moment.companionId,
          title: moment.title,
          description: moment.description,
          type: moment.kind,
          category: this.rules.categoryFor(moment.kind),
          significance: this.rules.significanceToScore(moment.significance),
          occurredAt: moment.scheduledFor,
        })
        .catch((err) => this.logger.warn({ err }, 'MomentService persistence failed'));
    }

    await this.publishTriggered(moment);
    return Result.success(moment);
  }

  private subscribe(): void {
    if (!this.eventEngine) return;
    for (const type of EVENT_TYPES_OF_INTEREST) {
      const handler = new MomentSourceEventHandler(this, type);
      this.eventEngine.subscribe(type, handler as any);
    }
  }

  private async publishTriggered(moment: ScheduledMoment): Promise<void> {
    if (!this.eventEngine) return;
    try {
      const event = new MomentTriggeredEvent(
        moment.id,
        {
          momentId: moment.id,
          userId: moment.userId,
          companionId: moment.companionId,
          kind: moment.kind,
          significance: moment.significance,
          title: moment.title,
          description: moment.description,
          scheduledFor: moment.scheduledFor,
          data: moment.data,
        },
        {
          userId: moment.userId,
          companionId: moment.companionId,
          correlationId: moment.id,
        }
      );
      await this.eventEngine.publish(event.getEnvelope(), EventDispatchMode.ASYNC);
    } catch (err) {
      this.logger.warn({ err, momentId: moment.id }, 'Failed to publish MOMENT_TRIGGERED');
    }
  }
}
