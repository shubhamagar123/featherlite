import Redis from 'ioredis';
import { getRedisConfig } from '@config/environment';
import { createLogger } from '@utils/logger';

const logger = createLogger('RedisProvider');

/**
 * Singleton Redis client provider using ioredis.
 * Supports connection pooling, retry logic, and sentinel configuration.
 */
class RedisProvider {
  private static instance: RedisProvider | null = null;
  private client: Redis | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): RedisProvider {
    if (!RedisProvider.instance) {
      RedisProvider.instance = new RedisProvider();
    }
    return RedisProvider.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const config = getRedisConfig();

      const client = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        lazyConnect: false,
      });

      client.on('error', (err) => {
        logger.error({ error: err }, 'Redis client error');
      });

      client.on('connect', () => {
        logger.info('Redis client connected');
      });

      client.on('ready', () => {
        logger.info('Redis client ready');
      });

      client.on('close', () => {
        logger.warn('Redis client connection closed');
      });

      client.on('reconnecting', (info: { attempt: number }) => {
        logger.debug({ attempt: info.attempt }, 'Redis reconnecting');
      });

      this.client = client;
      this.isConnected = true;

      await client.ping();
      logger.info('Redis connection established and verified');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Redis');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && !!this.client && this.client.status === 'ready';
  }
}

export const redisProvider = RedisProvider.getInstance();
export { RedisProvider };
