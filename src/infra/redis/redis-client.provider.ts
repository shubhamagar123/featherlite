import Redis from 'ioredis';
import { getRedisConfig } from '@config/environment';
import { createLogger } from '@utils/logger';

const logger = createLogger('RedisClientProvider');

interface RedisConnectionPool {
  default: Redis;
  cache?: Redis;
}

/**
 * Enhanced Redis client provider with pooling and sentinel support.
 * Manages multiple Redis connections for different purposes (cache, session, queue).
 */
class RedisClientProvider {
  private static instance: RedisClientProvider | null = null;
  private pool: Partial<RedisConnectionPool> = {};
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): RedisClientProvider {
    if (!RedisClientProvider.instance) {
      RedisClientProvider.instance = new RedisClientProvider();
    }
    return RedisClientProvider.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const config = getRedisConfig();

      // Primary connection for sessions, queues, DLQ
      this.pool.default = new Redis({
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

      // Optional dedicated cache connection for high-frequency reads
      // Useful for separating cache traffic from critical session/queue traffic
      if (process.env.REDIS_CACHE_DB) {
        this.pool.cache = new Redis({
          host: config.host,
          port: config.port,
          password: config.password,
          db: parseInt(process.env.REDIS_CACHE_DB, 10),
          retryStrategy: (times) => Math.min(times * 50, 2000),
          maxRetriesPerRequest: 2,
          enableReadyCheck: true,
          enableOfflineQueue: true,
          lazyConnect: false,
        });

        this.pool.cache.on('error', (err) =>
          logger.error({ error: err }, 'Redis cache client error')
        );
      }

      this.setupEventListeners(this.pool.default);

      // Verify connectivity
      await this.pool.default.ping();
      if (this.pool.cache) {
        await this.pool.cache.ping();
      }

      this.isInitialized = true;
      logger.info('Redis client pool initialized and verified');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Redis client pool');
      throw error;
    }
  }

  private setupEventListeners(client: Redis): void {
    client.on('error', (err) => {
      logger.error({ error: err }, 'Redis client error');
    });

    client.on('connect', () => {
      logger.info('Redis connected');
    });

    client.on('ready', () => {
      logger.info('Redis ready');
    });

    client.on('close', () => {
      logger.warn('Redis connection closed');
    });

    client.on('reconnecting', (info: { attempt: number }) => {
      logger.debug({ attempt: info.attempt }, 'Redis reconnecting');
    });
  }

  getClient(purpose: 'default' | 'cache' = 'default'): Redis {
    const client = this.pool[purpose];
    if (!client) {
      throw new Error(
        `Redis client for "${purpose}" not initialized. Call initialize() first.`
      );
    }
    return client;
  }

  async shutdown(): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.pool.default) {
      promises.push(this.pool.default.quit().catch(() => this.pool.default!.disconnect()));
    }

    if (this.pool.cache) {
      promises.push(this.pool.cache.quit().catch(() => this.pool.cache!.disconnect()));
    }

    await Promise.all(promises);
    this.pool = {};
    this.isInitialized = false;
    logger.info('Redis client pool shut down');
  }

  isReady(): boolean {
    return (
      this.isInitialized &&
      !!this.pool.default &&
      this.pool.default.status === 'ready'
    );
  }
}

export const redisClientProvider = RedisClientProvider.getInstance();
export { RedisClientProvider };
