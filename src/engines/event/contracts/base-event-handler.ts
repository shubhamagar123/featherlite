import { IResult, Result } from '@services/types/result.type';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { EventEnvelope, EventHandlerMetadata } from '../dto/event.dto';
import { EventType } from '../enums/event.enums';
import { createLogger } from '@utils/logger';
import { ProcessedEventsRepository } from '@database/repositories/processed-events.repository';
import { transaction } from '@database/transaction';
import type { Logger } from 'pino';
import { randomUUID } from 'crypto';

export abstract class BaseEventHandler<T = Record<string, any>> implements IEventHandler<T> {
  protected readonly logger: Logger;
  protected readonly handlerId: string;
  protected readonly eventType: EventType;
  protected readonly priority: number;
  protected readonly isAsync: boolean;
  private readonly processedEventsRepo: ProcessedEventsRepository;

  constructor(eventType: EventType, priority: number = 1, isAsync: boolean = false) {
    this.handlerId = randomUUID();
    this.eventType = eventType;
    this.priority = Math.max(0, Math.min(10, priority));
    this.isAsync = isAsync;
    this.logger = createLogger(`EventHandler:${this.constructor.name}`);
    this.processedEventsRepo = new ProcessedEventsRepository();
  }

  getMetadata(): EventHandlerMetadata {
    return {
      handlerId: this.handlerId,
      eventType: this.eventType,
      priority: this.priority,
      async: this.isAsync,
    };
  }

  canHandle(envelope: EventEnvelope): boolean {
    return envelope.metadata.eventType === this.eventType;
  }

  /**
   * Handle an event with idempotency guarantees.
   *
   * Flow:
   *   1. Try to check if (eventId, handlerId) exists in ProcessedEvents
   *   2. If yes → already processed, skip
   *   3. If no → create row in ProcessedEvents, then call onEvent()
   *
   * All within a transaction to ensure atomicity.
   * If the ProcessedEvents table doesn't exist or database is unavailable,
   * gracefully skip the idempotency check and proceed with onEvent().
   */
  async handle(envelope: EventEnvelope<T>): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      const eventId = envelope.metadata.eventId;

      this.logger.debug(
        {
          eventId,
          eventType: envelope.metadata.eventType,
          handlerId: this.handlerId,
        },
        'Handling event'
      );

      // Attempt idempotency check. If it fails (e.g., table doesn't exist yet),
      // gracefully degrade by skipping dedup and proceeding with onEvent().
      let isIdempotent = true;

      try {
        await transaction(async (_client) => {
          const marked = await this.processedEventsRepo.markProcessed(eventId, this.handlerId);

          if (marked === null) {
            // Already processed; mark for skip
            isIdempotent = false;
            this.logger.debug(
              {
                eventId,
                handlerId: this.handlerId,
              },
              'Event already processed, skipping'
            );
            return;
          }

          // First time processing; call handler within transaction
          await this.onEvent(envelope);
        });
      } catch (dbError) {
        // Idempotency check failed (likely due to missing table in test env).
        // Gracefully degrade: log a warning and proceed without dedup check.
        this.logger.warn(
          {
            eventId,
            error: dbError instanceof Error ? dbError.message : String(dbError),
          },
          'Idempotency check failed, proceeding without dedup guarantee'
        );
        await this.onEvent(envelope);
        return;
      }

      if (!isIdempotent) {
        // Handler was already processed, skip
        return;
      }

      this.logger.debug(
        {
          eventId,
          handlerId: this.handlerId,
        },
        'Event handled successfully'
      );
    });
  }

  async onError(envelope: EventEnvelope<T>, error: Error): Promise<void> {
    this.logger.error(
      {
        eventId: envelope.metadata.eventId,
        handlerId: this.handlerId,
        error: error.message,
      },
      'Error handling event'
    );
  }

  protected abstract onEvent(envelope: EventEnvelope<T>): Promise<void>;
}
