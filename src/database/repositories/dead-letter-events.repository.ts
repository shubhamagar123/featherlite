import { DeadLetterEvents, Prisma } from '@prisma/client';
import { BaseRepository } from '../repository.base';
import { prisma } from '../prisma';
import { DeadLetterEntry } from '@engines/event/dto/event.dto';

type DeadLetterEventsCreateInput = Prisma.DeadLetterEventsCreateInput;
type DeadLetterEventsUpdateInput = Prisma.DeadLetterEventsUpdateInput;

/**
 * Repository for DeadLetterEvents — persistent storage for failed events.
 * Complements Redis DLQ for durability and long-term retention.
 * Used for auditing, debugging, and replaying failed events.
 */
export class DeadLetterEventsRepository extends BaseRepository<
  DeadLetterEvents,
  DeadLetterEventsCreateInput,
  DeadLetterEventsUpdateInput
> {
  protected getDelegate() {
    return prisma.deadLetterEvents;
  }

  protected getModelName(): string {
    return 'DeadLetterEvents';
  }

  protected supportsSoftDelete(): boolean {
    return false;
  }

  /**
   * Store a dead-letter event in the database.
   */
  async recordFailedEvent(entry: DeadLetterEntry): Promise<DeadLetterEvents> {
    return this.create({
      eventId: entry.envelope.metadata.eventId,
      eventType: entry.envelope.metadata.eventType,
      aggregateId: entry.envelope.aggregateId,
      aggregateType: entry.envelope.aggregateType,
      payload: entry.envelope.payload as Record<string, any>,
      reason: entry.reason,
      attemptCount: entry.envelope.attemptCount,
      lastError: entry.envelope.lastError?.message || null,
      failedHandlers: entry.handlers ? (entry.handlers as any) : null,
    });
  }

  /**
   * Find a dead-letter event by event ID.
   */
  async findByEventId(eventId: string): Promise<DeadLetterEvents | null> {
    return this.findOne({ eventId });
  }

  /**
   * Find all dead-letter events by event type.
   */
  async findByEventType(eventType: string, limit: number = 100): Promise<DeadLetterEvents[]> {
    return this.findMany(
      { eventType },
      {
        take: limit,
        orderBy: { createdAt: 'desc' },
      }
    );
  }

  /**
   * Find all unplayed dead-letter events (replayedAt is null).
   */
  async findUnreplayed(limit: number = 100): Promise<DeadLetterEvents[]> {
    return this.findMany(
      { replayedAt: null },
      {
        take: limit,
        orderBy: { createdAt: 'asc' },
      }
    );
  }

  /**
   * Find all dead-letter events within a date range.
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<DeadLetterEvents[]> {
    return this.findMany(
      {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      {
        take: limit,
        orderBy: { createdAt: 'desc' },
      }
    );
  }

  /**
   * Mark a dead-letter event as replayed.
   */
  async markReplayed(eventId: string): Promise<DeadLetterEvents> {
    const current = await this.findOne({ eventId });
    if (!current) {
      throw new Error(`Dead letter event not found: ${eventId}`);
    }
    return this.update(
      current.id,
      { replayedAt: new Date() }
    );
  }

  /**
   * Increment attempt count for a dead-letter event.
   */
  async incrementAttempt(eventId: string, error?: Error): Promise<DeadLetterEvents> {
    const current = await this.findOne({ eventId });
    if (!current) {
      throw new Error(`Dead letter event not found: ${eventId}`);
    }

    return this.update(
      current.id,
      {
        attemptCount: current.attemptCount + 1,
        lastError: error?.message || null,
        updatedAt: new Date(),
      }
    );
  }

  /**
   * Count total dead-letter events.
   */
  async countAll(): Promise<number> {
    return this.count({});
  }

  /**
   * Count dead-letter events by event type.
   */
  async countByEventType(eventType: string): Promise<number> {
    return this.count({ eventType });
  }

  /**
   * Count unreplayed dead-letter events.
   */
  async countUnreplayed(): Promise<number> {
    return this.count({ replayedAt: null });
  }

  /**
   * Delete dead-letter events older than the given date.
   */
  async purgeOlderThan(date: Date): Promise<{ count: number }> {
    return this.hardDeleteMany({
      createdAt: { lt: date },
    });
  }

  /**
   * Get summary statistics for dead-letter events.
   */
  async getStatistics(): Promise<{
    total: number;
    unreplayed: number;
    byEventType: Record<string, number>;
  }> {
    const total = await this.countAll();
    const unreplayed = await this.countUnreplayed();

    const byEventType: Record<string, number> = {};
    const records = await this.findMany({}, { take: 1000 });
    const eventTypes = new Set(records.map((r) => r.eventType));

    for (const eventType of eventTypes) {
      byEventType[eventType] = await this.countByEventType(eventType);
    }

    return { total, unreplayed, byEventType };
  }
}
