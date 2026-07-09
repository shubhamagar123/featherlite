import { createClient } from 'redis';
import { getRedisConfig } from '@config/environment';
import { createLogger } from '@utils/logger';

const logger = createLogger('RedisProvider');

/**
 * Singleton Redis client for the application.
 * Provides both standard and connection pool access.
 */
class RedisProvider {
  private static instance: RedisProvider | null = null;
  private client: any = null;
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

      // Use REDIS_URL if available, else construct from host/port
      const client = createClient({
        url: config.url || `redis://${config.host}:${config.port}`,
        password: config.password,
        database: config.db,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      client.on('error', (err) => {
        logger.error({ error: err }, 'Redis client error');
      });

      client.on('connect', () => {
        logger.info('Redis client connected');
      });

      client.on('disconnect', () => {
        logger.warn('Redis client disconnected');
      });

      await client.connect();
      this.client = client;
      this.isConnected = true;

      logger.info('Redis connection established');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Redis');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }

  getClient(): any {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && !!this.client;
  }
}

export const redisProvider = RedisProvider.getInstance();
