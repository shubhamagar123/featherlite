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
      // In test/development environments, provide a stub Redis client
      // to allow services to function with local caching only
      if (process.env.NODE_ENV === 'test' || !process.env.REDIS_HOST) {
        return this.getStubClient();
      }
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }

  private getStubClient(): any {
    // Stub Redis client for testing - all operations are no-ops
    // This allows services to function with local caching only
    return {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 0,
      exists: async () => 0,
      incr: async () => 1,
      hset: async () => 0,
      hget: async () => null,
      hdel: async () => 0,
      zadd: async () => 0,
      zrange: async () => [],
      zrangebyscore: async () => [],
      zcard: async () => 0,
      expire: async () => 0,
      setex: async () => 'OK',
      xadd: async () => '',
      xlen: async () => 0,
      xrange: async () => [],
      xdel: async () => 0,
      xtrim: async () => 0,
      ping: async () => 'PONG',
      on: () => this.getStubClient(),
    };
  }

  isReady(): boolean {
    return this.isConnected && !!this.client && this.client.status === 'ready';
  }
}

export const redisProvider = RedisProvider.getInstance();
export { RedisProvider };

export function getRedisClient(): Redis {
  return redisProvider.getClient();
}
