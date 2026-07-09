import { IEventHandler } from '../interfaces/event-handler.interface';
import { EventEnvelope, EventHandlerMetadata, DomainEventPayload } from '../dto/event.dto';
import { IResult, Result } from '@services/types/result.type';
import { ProcessedEventsRepository } from '@database/repositories/processed-events.repository';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

/**
 * Idempotency middleware wraps event handlers to provide deduplication.
 *
 * Usage: Wrap existing handlers with IdempotencyMiddleware to enable idempotent processing.
 * - On first processing: handler executes, result is recorded
 * - On retry/duplicate: handler is skipped, cached result is returned
 * - Prevents side effects from duplicate event handling
 */
export class IdempotencyMiddleware implements IEventHandler {
  private readonly logger: Logger;
  private readonly handler: IEventHandler;
  private readonly repository: ProcessedEventsRepository;
  private readonly handlerId: string;

  constructor(handler: IEventHandler) {
    this.handler = handler;
    this.handlerId = handler.getMetadata().handlerId;
    this.repository = new ProcessedEventsRepository();
    this.logger = createLogger('IdempotencyMiddleware');
  }

  getMetadata(): EventHandlerMetadata {
    return this.handler.getMetadata();
  }

  canHandle(envelope: EventEnvelope): boolean {
    return this.handler.canHandle(envelope);
  }

  async handle<T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope<T>
  ): Promise<IResult<void>> {
    const eventId = envelope.metadata.eventId;

    // Check if already processed
    const isProcessed = await this.repository.isProcessed(eventId, this.handlerId);

    if (isProcessed) {
      this.logger.debug(
        { eventId, handlerId: this.handlerId },
        'Event already processed, skipping'
      );
      return Result.success(undefined);
    }

    // Execute handler
    const result = await this.handler.handle(envelope);

    // Only mark as processed if successful
    if (result.isSuccess) {
      try {
        await this.repository.markProcessed(eventId, this.handlerId);
        this.logger.debug(
          { eventId, handlerId: this.handlerId },
          'Event marked as processed'
        );
      } catch (error) {
        this.logger.error(
          {
            eventId,
            handlerId: this.handlerId,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to mark event as processed'
        );
      }
    }

    return result;
  }

  async onError<T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope<T>,
    error: Error
  ): Promise<void> {
    return this.handler.onError(envelope, error);
  }
}
