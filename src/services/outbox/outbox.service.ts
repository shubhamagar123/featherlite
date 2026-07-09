import { IResult, Result } from '@services/types/result.type';
import { BaseService } from '@services/base/base.service';
import { NotFoundError } from '@services/exceptions';
import { EventEnvelope, DomainEventPayload } from '@engines/event';
import { EventStatus, EventDispatchMode } from '@engines/event/enums/event.enums';
import { OutboxRepository } from '@database/repositories/outbox.repository';
import { prisma } from '@database/prisma';
import type { Prisma } from '@prisma/client';
import type { IEventBus } from '@engines/event/interfaces/event-bus.interface';

/**
 * OutboxService manages transactional event persistence.
 *
 * Usage from engines:
 *   const result = await outboxService.persist(envelope, txClient);
 *   if (result.isSuccess) {
 *     // Event written to Outbox; OutboxPoller will publish it asynchronously
 *   }
 *
 * The event is written within the same Prisma transaction as the aggregate
 * mutation, guaranteeing atomicity: either both succeed or both fail.
 */
export class OutboxService extends BaseService {
  protected readonly loggerName = 'OutboxService';
  private readonly repository: OutboxRepository;

  constructor() {
    super();
    this.repository = new OutboxRepository();
  }

  /**
   * Persist an event to the Outbox table.
   *
   * @param envelope The event to persist
   * @param tx Optional Prisma transaction client. If provided, the write happens
   *           within that transaction; if omitted, a standalone write is used.
   * @returns Result with the persisted outbox entry
   */
  async persist<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    tx?: Prisma.TransactionClient
  ): Promise<IResult<{ outboxId: string }>> {
    return Result.tryAsync(async () => {
      const delegate = tx ? tx.outbox : prisma.outbox;

      const result = await delegate.create({
        data: {
          aggregateId: envelope.aggregateId,
          aggregateType: envelope.aggregateType,
          eventType: envelope.metadata.eventType,
          eventName: envelope.metadata.eventName,
          payload: JSON.stringify(envelope.payload),
          metadata: JSON.stringify(envelope.metadata),
          status: 'PENDING',
          attempts: 0,
          nextRetryAt: new Date(),
        },
      });

      this.logBusinessEvent('outbox_event_persisted', {
        outboxId: result.id,
        aggregateId: envelope.aggregateId,
        eventType: envelope.metadata.eventType,
        eventId: envelope.metadata.eventId,
      });

      return { outboxId: result.id };
    });
  }

  /**
   * Publish a pending outbox entry by ID. Called by OutboxPoller.
   *
   * @param outboxId The ID of the outbox entry
   * @param eventBus The event bus to publish to
   * @returns Result indicating success or failure
   */
  async publishById(outboxId: string, eventBus: IEventBus): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      const outbox = await this.repository.findById(outboxId);

      if (!outbox) {
        throw new NotFoundError('Outbox', outboxId);
      }

      if (outbox.status !== 'PENDING') {
        this.logWarn(
          `Outbox entry ${outboxId} is in status ${outbox.status}, skipping`,
          { outboxId, status: outbox.status }
        );
        return;
      }

      // Deserialize payload and metadata
      const payload = JSON.parse(outbox.payload);
      const metadata = JSON.parse(outbox.metadata);

      const envelope: EventEnvelope = {
        metadata,
        aggregateId: outbox.aggregateId,
        aggregateType: outbox.aggregateType as any,
        payload,
        status: EventStatus.PROCESSING,
        attemptCount: outbox.attempts,
      };

      // Publish via event bus
      const publishResult = await eventBus.publish(envelope, EventDispatchMode.ASYNC);

      if (publishResult.isSuccess) {
        await this.repository.markPublished(outboxId);
        this.logBusinessEvent('outbox_event_published', {
          outboxId,
          eventId: metadata.eventId,
          eventType: metadata.eventType,
        });
      } else {
        const nextRetry = new Date(Date.now() + 5000); // Retry in 5s
        await this.repository.markFailed(outboxId, publishResult.error?.message || 'Unknown error', nextRetry);
        this.logWarn(
          `Failed to publish outbox entry ${outboxId}`,
          { outboxId, error: publishResult.error?.message }
        );
      }
    });
  }

  /**
   * Cleanup published outbox entries older than a given date.
   * Called periodically by a scheduled job.
   */
  async purgePublishedBefore(olderThanDays: number = 7): Promise<IResult<{ purgedCount: number }>> {
    return Result.tryAsync(async () => {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      const result = await this.repository.archivePublishedBefore(cutoffDate);

      this.logBusinessEvent('outbox_entries_purged', {
        purgedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
      });

      return { purgedCount: result.count };
    });
  }
}
