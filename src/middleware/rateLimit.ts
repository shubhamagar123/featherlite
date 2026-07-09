import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '@infra/redis/redis.provider';
import { logger } from '@utils/logger';
import { AppError, ErrorCode } from '@utils/error';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator (default: user ID or IP)
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

/**
 * Rate limiting middleware using Redis
 * Tracks requests per key (user ID or IP) within a time window
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const redis = getRedisClient();

      // Generate rate limit key
      const key = finalConfig.keyGenerator
        ? finalConfig.keyGenerator(req)
        : req.user?.uid || req.ip || 'anonymous';

      const rateLimitKey = `ratelimit:${key}`;
      const windowSeconds = Math.ceil(finalConfig.windowMs / 1000);

      // Increment counter and set expiration
      const current = await redis.incr(rateLimitKey);

      if (current === 1) {
        // First request in window, set expiration
        await redis.expire(rateLimitKey, windowSeconds);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', finalConfig.maxRequests.toString());
      res.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, finalConfig.maxRequests - current).toString()
      );
      res.setHeader(
        'X-RateLimit-Reset',
        (Date.now() + finalConfig.windowMs).toString()
      );

      if (current > finalConfig.maxRequests) {
        logger.warn(
          {
            key,
            current,
            maxRequests: finalConfig.maxRequests,
            windowMs: finalConfig.windowMs,
            ip: req.ip,
            path: req.path,
          },
          'Rate limit exceeded'
        );

        throw new AppError(
          429,
          ErrorCode.RATE_LIMITED,
          'Too many requests, please try again later',
          {
            retryAfter: Math.ceil(finalConfig.windowMs / 1000),
          }
        );
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error({ error }, 'Rate limiting error');
      // On error, allow request but log it
      next();
    }
  };
}

/**
 * Pre-configured rate limiters for common scenarios
 */
export const rateLimiters = {
  // Global rate limit: 100 requests per minute per user
  global: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyGenerator: (req) => req.user?.uid || req.ip || 'anonymous',
  }),

  // Auth endpoints: 5 requests per minute per IP
  auth: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyGenerator: (req) => req.ip || 'anonymous',
  }),

  // Chat endpoint: 30 requests per minute per user
  chat: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyGenerator: (req) => req.user?.uid || req.ip || 'anonymous',
  }),

  // API endpoint: 500 requests per minute per user
  api: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 500,
    keyGenerator: (req) => req.user?.uid || req.ip || 'anonymous',
  }),
};
