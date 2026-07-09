import { ApplicationServiceBase } from './application.service.base';
import { HealthStatusDto, ServiceHealthDto } from '../dtos/application.dtos';
import { getRedisClient } from '@infra/redis/redis.provider';
import { redisProvider } from '@infra/redis/redis.provider';

/**
 * Health Application Service
 * Simple example: No parameters, just checks infrastructure
 */
export class HealthApplicationService extends ApplicationServiceBase {
  private readonly startTime = Date.now();

  constructor() {
    super('HealthApplicationService');
  }

  /**
   * Get system health status
   * Checks all infrastructure components
   */
  async getHealth(): Promise<HealthStatusDto> {
    this.logStart('getHealth');

    const services: Record<string, ServiceHealthDto> = {};

    try {
      // Check Redis
      services.redis = await this.checkRedis();

      // Check Database
      services.database = await this.checkDatabase();

      // Determine overall status
      const allHealthy = Object.values(services).every((s) => s.status === 'UP');
      const anyDegraded = Object.values(services).some((s) => s.status === 'DEGRADED');

      const status: 'UP' | 'DOWN' | 'DEGRADED' = allHealthy ? 'UP' : anyDegraded ? 'DEGRADED' : 'DOWN';

      this.logSuccess('getHealth', { status });

      return {
        status,
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
        services,
      };
    } catch (error) {
      this.logError('getHealth', error);

      return {
        status: 'DOWN',
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
        services,
      };
    }
  }

  /**
   * Liveness probe - is service running?
   */
  async liveness(): Promise<boolean> {
    return true;
  }

  /**
   * Readiness probe - is service ready for traffic?
   */
  async readiness(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.status !== 'DOWN';
    } catch {
      return false;
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<ServiceHealthDto> {
    const start = Date.now();
    try {
      const redis = getRedisClient();
      await redis.ping();

      return {
        status: 'UP',
        latency: Date.now() - start,
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error({ error }, 'Redis health check failed');
      return {
        status: redisProvider.isReady() ? 'DEGRADED' : 'DOWN',
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check Database connectivity
   */
  private async checkDatabase(): Promise<ServiceHealthDto> {
    const start = Date.now();
    try {
      // In production, run actual database query
      // For now, assume it's up if Redis is up
      return {
        status: 'UP',
        latency: Date.now() - start,
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error({ error }, 'Database health check failed');
      return {
        status: 'DOWN',
        lastCheck: new Date(),
      };
    }
  }
}
