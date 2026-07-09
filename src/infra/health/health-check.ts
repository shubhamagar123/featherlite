import { prisma } from '@database/prisma';
import { getRedisClient } from '@infra/redis/redis.provider';
import { logger } from '@utils/logger';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  checks: Record<string, CheckResult>;
}

export interface CheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  error?: string;
  version?: string;
}

export class HealthChecker {
  static async performHealthCheck(): Promise<HealthCheckResult> {
    const results: Record<string, CheckResult> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Database check
    results.database = await this.checkDatabase();
    if (results.database.status === 'unhealthy') overallStatus = 'unhealthy';
    if (results.database.status === 'degraded') overallStatus = 'degraded';

    // Cache check
    results.cache = await this.checkCache();
    if (results.cache.status === 'unhealthy') overallStatus = 'unhealthy';
    if (results.cache.status === 'degraded' && overallStatus !== 'unhealthy') {
      overallStatus = 'degraded';
    }

    // Memory check
    results.memory = this.checkMemory();
    if (results.memory.status === 'unhealthy') overallStatus = 'unhealthy';
    if (results.memory.status === 'degraded' && overallStatus !== 'unhealthy') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: results,
    };
  }

  static async performReadinessCheck(): Promise<HealthCheckResult> {
    const results: Record<string, CheckResult> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Only perform critical checks for readiness
    results.database = await this.checkDatabase();
    if (results.database.status === 'unhealthy') overallStatus = 'unhealthy';

    results.cache = await this.checkCache();
    if (results.cache.status === 'unhealthy') overallStatus = 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: results,
    };
  }

  private static async checkDatabase(): Promise<CheckResult> {
    const startMs = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        latencyMs: Date.now() - startMs,
      };
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startMs,
      };
    }
  }

  private static async checkCache(): Promise<CheckResult> {
    const startMs = Date.now();
    try {
      const client = getRedisClient();
      const pong = await client.ping();

      if (pong === 'PONG') {
        return {
          status: 'healthy',
          latencyMs: Date.now() - startMs,
        };
      }

      return {
        status: 'unhealthy',
        error: 'Unexpected PING response',
        latencyMs: Date.now() - startMs,
      };
    } catch (error) {
      logger.error({ error }, 'Cache health check failed');
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startMs,
      };
    }
  }

  private static checkMemory(): CheckResult {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

    if (heapUsedPercent > 90) {
      return {
        status: 'unhealthy',
        error: `Heap usage critical: ${heapUsedPercent.toFixed(2)}%`,
      };
    }

    if (heapUsedPercent > 70) {
      return {
        status: 'degraded',
        error: `Heap usage high: ${heapUsedPercent.toFixed(2)}%`,
      };
    }

    return {
      status: 'healthy',
    };
  }
}
