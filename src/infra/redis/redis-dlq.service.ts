import { redisProvider } from './redis.provider';
import { DeadLetterEntry } from '@engines/event/dto/event.dto';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

/**
 * Redis stream-based dead-letter queue (DLQ) for persisting failed events.
 * Uses Redis XADD for appending and XRANGE for retrieval with automatic pruning.
 */
export class RedisDLQService {
  private readonly logger: Logger;
  private readonly streamKey = 'event:dlq:main';
  private readonly maxStreamLength = 10000;

  constructor() {
    this.logger = createLogger('RedisDLQ');
  }

  /**
   * Append a dead-letter entry to the Redis stream.
   * Automatically trims stream if it exceeds maxStreamLength.
   */
  async append(entry: DeadLetterEntry): Promise<void> {
    try {
      const client = redisProvider.getClient();

      const serialized = JSON.stringify({
        eventId: entry.envelope.metadata.eventId,
        eventType: entry.envelope.metadata.eventType,
        reason: entry.reason,
        timestamp: entry.timestamp.toISOString(),
        handlers: (entry.handlers || []).map(h => ({
          id: h.handlerId,
          eventType: h.eventType,
          priority: h.priority,
          async: h.async,
        })),
        payload: entry.envelope.payload,
      });

      await client.xAdd(this.streamKey, '*', {
        data: serialized,
      });

      this.logger.debug(
        {
          eventId: entry.envelope.metadata.eventId,
          streamKey: this.streamKey,
        },
        'Dead letter entry appended to Redis stream'
      );

      await this.trimStream();
    } catch (error) {
      this.logger.error(
        { error, eventId: entry.envelope.metadata.eventId },
        'Failed to append to Redis DLQ'
      );
    }
  }

  /**
   * Retrieve all dead-letter entries from the Redis stream.
   * Returns most recent entries first (reverse order).
   */
  async getAll(): Promise<DeadLetterEntry[]> {
    try {
      const client = redisProvider.getClient();
      const entries = await client.xRange(this.streamKey, '-', '+');

      return entries
        .reverse()
        .map((entry: any) => {
          try {
            const data = JSON.parse(entry.message.data as string);
            return {
              envelope: {
                metadata: {
                  eventId: data.eventId,
                  eventType: data.eventType,
                },
                payload: data.payload,
              },
              reason: data.reason,
              timestamp: new Date(data.timestamp),
              handlers: data.handlers.map((h: any) => ({
                handlerId: h.id,
                eventType: h.eventType,
                priority: h.priority,
                async: h.async,
              })),
            } as DeadLetterEntry;
          } catch (parseError) {
            this.logger.warn(
              { error: parseError, entry: entry.id },
              'Failed to parse dead letter entry'
            );
            return null;
          }
        })
        .filter((entry: DeadLetterEntry | null): entry is DeadLetterEntry => entry !== null);
    } catch (error) {
      this.logger.error({ error }, 'Failed to retrieve entries from Redis DLQ');
      return [];
    }
  }

  /**
   * Retrieve dead-letter entries within a date range.
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<DeadLetterEntry[]> {
    try {
      const allEntries = await this.getAll();
      return allEntries.filter(
        (entry: DeadLetterEntry) => entry.timestamp >= startDate && entry.timestamp <= endDate
      );
    } catch (error) {
      this.logger.error({ error }, 'Failed to retrieve entries by date range');
      return [];
    }
  }

  /**
   * Retrieve dead-letter entries for a specific event type.
   */
  async getByEventType(eventType: string): Promise<DeadLetterEntry[]> {
    try {
      const allEntries = await this.getAll();
      return allEntries.filter(
        (entry: DeadLetterEntry) => entry.envelope.metadata.eventType === eventType
      );
    } catch (error) {
      this.logger.error({ error, eventType }, 'Failed to retrieve entries by event type');
      return [];
    }
  }

  /**
   * Count total dead-letter entries in the stream.
   */
  async count(): Promise<number> {
    try {
      const client = redisProvider.getClient();
      const length = await client.xLen(this.streamKey);
      return length;
    } catch (error) {
      this.logger.error({ error }, 'Failed to count DLQ entries');
      return 0;
    }
  }

  /**
   * Clear all dead-letter entries (use with caution).
   */
  async clear(): Promise<void> {
    try {
      const client = redisProvider.getClient();
      await client.del(this.streamKey);
      this.logger.info('Dead letter queue cleared');
    } catch (error) {
      this.logger.error({ error }, 'Failed to clear Redis DLQ');
    }
  }

  /**
   * Purge entries older than the specified date.
   */
  async purgeOlderThan(date: Date): Promise<number> {
    try {
      const allEntries = await this.getAll();
      const oldEntries = allEntries.filter(entry => entry.timestamp < date);

      if (oldEntries.length === 0) {
        return 0;
      }

      const client = redisProvider.getClient();

      for (const entry of oldEntries) {
        const entries = await client.xRange(this.streamKey, '-', '+');
        const toDelete = entries.find((e: any) => {
          try {
            const data = JSON.parse(e.message.data as string);
            return data.eventId === entry.envelope.metadata.eventId;
          } catch {
            return false;
          }
        });

        if (toDelete) {
          await client.xDel(this.streamKey, toDelete.id);
        }
      }

      this.logger.info(
        { purgedCount: oldEntries.length, beforeDate: date.toISOString() },
        'Purged old dead letter entries'
      );

      return oldEntries.length;
    } catch (error) {
      this.logger.error({ error }, 'Failed to purge old entries from Redis DLQ');
      return 0;
    }
  }

  /**
   * Trim the stream to maxStreamLength if it exceeds the limit.
   * Uses approximate trimming (MAXLEN ~) for efficiency.
   */
  private async trimStream(): Promise<void> {
    try {
      const client = redisProvider.getClient();
      const length = await client.xLen(this.streamKey);

      if (length > this.maxStreamLength) {
        await client.xTrim(this.streamKey, 'MAXLEN', {
          count: this.maxStreamLength,
          approximateTrimming: true,
        });

        this.logger.debug(
          { streamKey: this.streamKey, trimmedTo: this.maxStreamLength },
          'Trimmed Redis DLQ stream to max length'
        );
      }
    } catch (error) {
      this.logger.warn({ error }, 'Failed to trim Redis DLQ stream');
    }
  }
}

export const redisDLQService = new RedisDLQService();
