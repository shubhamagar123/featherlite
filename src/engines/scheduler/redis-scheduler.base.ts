import Redis from 'ioredis';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

/**
 * Base Redis-backed scheduler using sorted sets.
 *
 * Sorted set architecture:
 * - Key: scheduler:<type> (e.g., scheduler:notification, scheduler:moment)
 * - Score: scheduledFor timestamp in milliseconds
 * - Member: encoded notification/moment ID
 *
 * Allows O(log N) "list due" queries via ZRANGEBYSCORE.
 */
export abstract class RedisSchedulerBase<T> {
  protected readonly logger: Logger;
  protected readonly schedulerKey: string;
  protected readonly detailsHashKey: string;

  constructor(
    protected redisClient: Redis,
    schedulerType: string,
    loggerName: string
  ) {
    this.logger = createLogger(loggerName);
    this.schedulerKey = `scheduler:${schedulerType}`;
    this.detailsHashKey = `scheduler-details:${schedulerType}`;
  }

  /**
   * Schedule an item for future execution.
   * Stores in sorted set (score=scheduledFor) and details hash.
   */
  protected async scheduleItem(item: T & { id: string; scheduledFor: Date }): Promise<void> {
    try {
      const score = item.scheduledFor.getTime();
      const itemData = JSON.stringify(item);

      await Promise.all([
        this.redisClient.zadd(this.schedulerKey, score, item.id),
        this.redisClient.hset(this.detailsHashKey, item.id, itemData),
      ]);

      this.logger.debug({ itemId: item.id, scheduledFor: item.scheduledFor }, 'Item scheduled');
    } catch (error) {
      this.logger.error({ error, itemId: (item as any).id }, 'Failed to schedule item');
    }
  }

  /**
   * Get item details by ID.
   */
  protected async getItem(itemId: string): Promise<T | null> {
    try {
      const data = await this.redisClient.hget(this.detailsHashKey, itemId);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error({ error, itemId }, 'Failed to get item from Redis');
      return null;
    }
  }

  /**
   * Get all items due by a specific time.
   * Uses ZRANGEBYSCORE for efficient range query.
   */
  protected async getItemsDue(now: Date): Promise<T[]> {
    try {
      const nowMs = now.getTime();
      const ids = await this.redisClient.zrangebyscore(this.schedulerKey, '-inf', nowMs);

      if (!ids || ids.length === 0) {
        return [];
      }

      const items: T[] = [];
      for (const id of ids) {
        const item = await this.getItem(id);
        if (item) {
          items.push(item);
        }
      }

      return items;
    } catch (error) {
      this.logger.error({ error }, 'Failed to get items due from Redis');
      return [];
    }
  }

  /**
   * Remove item from scheduler.
   */
  protected async removeItem(itemId: string): Promise<void> {
    try {
      await Promise.all([
        this.redisClient.zrem(this.schedulerKey, itemId),
        this.redisClient.hdel(this.detailsHashKey, itemId),
      ]);

      this.logger.debug({ itemId }, 'Item removed from scheduler');
    } catch (error) {
      this.logger.error({ error, itemId }, 'Failed to remove item from Redis');
    }
  }

  /**
   * Update item status.
   */
  protected async updateItem(itemId: string, updates: Partial<T>): Promise<void> {
    try {
      const existing = await this.getItem(itemId);
      if (!existing) {
        this.logger.warn({ itemId }, 'Item not found when updating');
        return;
      }

      const updated = { ...existing, ...updates };
      const itemData = JSON.stringify(updated);

      await this.redisClient.hset(this.detailsHashKey, itemId, itemData);
      this.logger.debug({ itemId }, 'Item updated');
    } catch (error) {
      this.logger.error({ error, itemId }, 'Failed to update item in Redis');
    }
  }

  /**
   * Get all items for a user.
   */
  protected async getItemsByUser(userId: string): Promise<T[]> {
    try {
      const allData = await this.redisClient.hgetall(this.detailsHashKey);
      const items: T[] = [];

      for (const [, data] of Object.entries(allData)) {
        const item = JSON.parse(data) as T & { userId?: string };
        if (item.userId === userId) {
          items.push(item as T);
        }
      }

      return items;
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to get user items from Redis');
      return [];
    }
  }

  /**
   * Count items in scheduler.
   */
  protected async countItems(): Promise<number> {
    try {
      return await this.redisClient.zcard(this.schedulerKey);
    } catch (error) {
      this.logger.error({ error }, 'Failed to count scheduler items');
      return 0;
    }
  }

  /**
   * Clear all items (use with caution).
   */
  protected async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.redisClient.del(this.schedulerKey),
        this.redisClient.del(this.detailsHashKey),
      ]);

      this.logger.info('Scheduler cleared');
    } catch (error) {
      this.logger.error({ error }, 'Failed to clear scheduler');
    }
  }
}
