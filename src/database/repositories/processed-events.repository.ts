import { ProcessedEvents, Prisma } from '@prisma/client';
import { BaseRepository } from '../repository.base';
import { prisma } from '../prisma';

type ProcessedEventsCreateInput = Prisma.ProcessedEventsCreateInput;
type ProcessedEventsUpdateInput = Prisma.ProcessedEventsUpdateInput;

/**
 * Repository for ProcessedEvents — the idempotency store.
 *
 * Handlers use this to deduplicate event processing. Pattern:
 *   1. Before handling an event, try to create a ProcessedEvents row with (eventId, handlerId).
 *   2. If creation succeeds → first time processing, continue.
 *   3. If creation fails (unique constraint) → already processed, skip.
 */
export class ProcessedEventsRepository extends BaseRepository<
  ProcessedEvents,
  ProcessedEventsCreateInput,
  ProcessedEventsUpdateInput
> {
  protected getDelegate() {
    return prisma.processedEvents;
  }

  protected getModelName(): string {
    return 'ProcessedEvents';
  }

  protected supportsSoftDelete(): boolean {
    return false;
  }

  /**
   * Check if an event has already been processed by a handler.
   */
  async isProcessed(eventId: string, handlerId: string): Promise<boolean> {
    const existing = await this.findOne({ eventId, handlerId });
    return !!existing;
  }

  /**
   * Mark an event as processed by a handler. Returns the created record on success.
   * If the event+handler was already processed, returns null (treat as idempotent).
   *
   * This uses Prisma's `createUnique` pattern with `onConflict` to atomically
   * check + insert. In real-world usage, we'd use Postgres' INSERT...ON CONFLICT
   * directly. For now, rely on unique constraint to prevent duplicates.
   */
  async markProcessed(eventId: string, handlerId: string): Promise<ProcessedEvents | null> {
    try {
      return await this.create({ eventId, handlerId });
    } catch (error) {
      // If unique constraint violation, the event was already processed.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return null; // Already processed
      }
      throw error;
    }
  }

  /**
   * Find all processed events for a given handler (for auditing).
   */
  async findByHandlerId(handlerId: string, limit: number = 100): Promise<ProcessedEvents[]> {
    return this.findMany({ handlerId }, { take: limit, orderBy: { processedAt: 'desc' } });
  }

  /**
   * Find all handlers that have processed a given event.
   */
  async findByEventId(eventId: string): Promise<ProcessedEvents[]> {
    return this.findMany({ eventId }, { orderBy: { processedAt: 'desc' } });
  }

  /**
   * Purge processed events older than the given date (for cleanup).
   */
  async purgeOlderThan(date: Date): Promise<{ count: number }> {
    return this.hardDeleteMany({ processedAt: { lt: date } });
  }
}
