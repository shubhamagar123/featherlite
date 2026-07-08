import { IResult, Result } from '@services/types/result.type';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { EventEnvelope, EventHandlerMetadata } from '../dto/event.dto';
import { EventType } from '../enums/event.enums';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { randomUUID } from 'crypto';

export abstract class BaseEventHandler<T = Record<string, any>> implements IEventHandler<T> {
  protected readonly logger: Logger;
  protected readonly handlerId: string;
  protected readonly eventType: EventType;
  protected readonly priority: number;
  protected readonly isAsync: boolean;

  constructor(eventType: EventType, priority: number = 1, isAsync: boolean = false) {
    this.handlerId = randomUUID();
    this.eventType = eventType;
    this.priority = Math.max(0, Math.min(10, priority));
    this.isAsync = isAsync;
    this.logger = createLogger(`EventHandler:${this.constructor.name}`);
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

  async handle(envelope: EventEnvelope<T>): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      this.logger.debug(
        {
          eventId: envelope.metadata.eventId,
          eventType: envelope.metadata.eventType,
          handlerId: this.handlerId,
        },
        'Handling event'
      );

      await this.onEvent(envelope);

      this.logger.debug(
        {
          eventId: envelope.metadata.eventId,
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
