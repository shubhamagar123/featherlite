import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { IResponseProcessor, IResponseParser, IResponseValidator, IResponseDetector } from './interfaces/response-processor.interfaces';
import {
  RawLLMResponse,
  ProcessedResponse,
  ResponseProcessingContext,
  DetectedItem,
  ResponseValidationOutcome,
} from './dtos/response-processor.dtos';
import { ResponseProcessingStatus, ResponseValidationSeverity } from './enums/response-processor.enums';
import { ResponseParser } from './parsers/response.parser';
import { SchemaValidator } from './validators/schema.validator';
import { SafetyValidator } from './validators/safety.validator';
import { FollowUpDetector } from './detectors/follow-up.detector';
import { ReminderDetector } from './detectors/reminder.detector';
import { MemoryCandidateDetector } from './detectors/memory-candidate.detector';
import { RelationshipUpdateDetector } from './detectors/relationship-update.detector';
import { NotificationCandidateDetector } from './detectors/notification-candidate.detector';
import { MomentCandidateDetector } from './detectors/moment-candidate.detector';
import { ResponseRules } from './rules/response.rules';
import { ResponseProcessedEvent } from './events/response-processed.event';
import { EventEngine, EventDispatchMode } from '@engines/event';

export interface ResponseProcessorDeps {
  parser?: IResponseParser;
  validators?: IResponseValidator[];
  detectors?: IResponseDetector[];
  rules?: ResponseRules;
  eventEngine?: EventEngine;
}

export class ResponseProcessor implements IResponseProcessor {
  private readonly logger: Logger;
  private readonly parser: IResponseParser;
  private readonly validators: IResponseValidator[];
  private readonly detectors: IResponseDetector[];
  private readonly rules: ResponseRules;
  private readonly eventEngine?: EventEngine;

  constructor(deps: ResponseProcessorDeps = {}) {
    this.logger = createLogger('ResponseProcessor');
    this.parser = deps.parser ?? new ResponseParser();
    this.validators = deps.validators ?? [new SchemaValidator(), new SafetyValidator()];
    this.detectors = deps.detectors ?? [
      new FollowUpDetector(),
      new ReminderDetector(),
      new MemoryCandidateDetector(),
      new RelationshipUpdateDetector(),
      new NotificationCandidateDetector(),
      new MomentCandidateDetector(),
    ];
    this.rules = deps.rules ?? new ResponseRules();
    this.eventEngine = deps.eventEngine;
  }

  async process(ctx: ResponseProcessingContext): Promise<IResult<ProcessedResponse>> {
    const startedAt = Date.now();
    try {
      const parsed = this.parser.parse(ctx.raw);
      if (!parsed.isSuccess || !parsed.value) {
        return this.failedResponse(ctx.raw, ResponseProcessingStatus.FAILED, parsed.error, startedAt);
      }

      const validationOutcomes: ResponseValidationOutcome[] = [];
      for (const v of this.validators) {
        const outcome = v.validate(parsed.value, ctx);
        if (outcome.isSuccess && outcome.value) validationOutcomes.push(outcome.value);
      }
      const merged = this.rules.merge(validationOutcomes);

      let detections: DetectedItem[] = [];
      if (merged.isValid) {
        for (const d of this.detectors) {
          const result = d.detect(parsed.value, ctx);
          if (result.isSuccess && result.value) detections = detections.concat(result.value);
        }
      }

      const status = !merged.isValid
        ? ResponseProcessingStatus.REJECTED
        : ResponseProcessingStatus.PUBLISHED;

      const processed: ProcessedResponse = {
        requestId: ctx.raw.requestId,
        userId: ctx.raw.userId,
        companionId: ctx.raw.companionId,
        status,
        parsed: parsed.value,
        validation: merged,
        detections,
        finalContent: merged.isValid ? parsed.value.text ?? ctx.raw.content : '',
        processedAt: new Date(),
        durationMs: Date.now() - startedAt,
      };

      await this.publishProcessedEvent(processed, ctx);
      return Result.success(processed);
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      this.logger.error({ err: errObj }, 'ResponseProcessor.process failed');
      return this.failedResponse(ctx.raw, ResponseProcessingStatus.FAILED, errObj, startedAt);
    }
  }

  private failedResponse(
    raw: RawLLMResponse,
    status: ResponseProcessingStatus,
    error: Error | undefined,
    startedAt: number
  ): IResult<ProcessedResponse> {
    const outcome: ProcessedResponse = {
      requestId: raw.requestId,
      userId: raw.userId,
      companionId: raw.companionId,
      status,
      parsed: { requestId: raw.requestId, format: raw.format, text: raw.content },
      validation: {
        isValid: false,
        isSafe: false,
        issues: error
          ? [
              {
                code: 'PROCESSOR_FAILED',
                severity: ResponseValidationSeverity.BLOCKING,
                message: error.message,
              },
            ]
          : [],
      },
      detections: [],
      finalContent: '',
      processedAt: new Date(),
      durationMs: Date.now() - startedAt,
    };
    return Result.success(outcome);
  }

  private async publishProcessedEvent(
    processed: ProcessedResponse,
    ctx: ResponseProcessingContext
  ): Promise<void> {
    if (!this.eventEngine) return;
    try {
      const event = new ResponseProcessedEvent(
        processed.requestId,
        {
          requestId: processed.requestId,
          userId: processed.userId,
          companionId: processed.companionId,
          isValid: processed.validation.isValid,
          isSafe: processed.validation.isSafe,
          detectionsCount: processed.detections.length,
          finalContentLength: processed.finalContent.length,
          durationMs: processed.durationMs,
        },
        {
          userId: processed.userId,
          companionId: processed.companionId,
          correlationId: ctx.raw.correlationId ?? processed.requestId,
        }
      );
      await this.eventEngine.publish(event.getEnvelope(), EventDispatchMode.ASYNC);
    } catch (err) {
      this.logger.warn({ err }, 'Failed to publish ResponseProcessed event');
    }
  }
}
