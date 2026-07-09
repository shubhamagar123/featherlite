import { trace } from '@opentelemetry/api';
import { logger } from '@utils/logger';

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_API = 'external_api',
  DATABASE = 'database',
  CACHE = 'cache',
  LLM = 'llm',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

export interface ErrorMetrics {
  category: ErrorCategory;
  statusCode: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retriable: boolean;
  userId?: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

export class ErrorTracker {
  private static readonly tracer = trace.getTracer('error-tracker');
  private static errorCounts: Map<string, number> = new Map();

  static categorizeError(error: Error | unknown): ErrorCategory {
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.name === 'ValidationError' || err instanceof SyntaxError) {
      return ErrorCategory.VALIDATION;
    }

    if (err.name === 'JsonWebTokenError') {
      return ErrorCategory.AUTHENTICATION;
    }

    if (err.name === 'TokenExpiredError') {
      return ErrorCategory.AUTHENTICATION;
    }

    const msg = err.message.toLowerCase();

    if (msg.includes('unauthorized') || msg.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }

    if (msg.includes('not found') || msg.includes('notfound')) {
      return ErrorCategory.NOT_FOUND;
    }

    if (msg.includes('conflict') || msg.includes('duplicate')) {
      return ErrorCategory.CONFLICT;
    }

    if (msg.includes('rate limit') || msg.includes('too many')) {
      return ErrorCategory.RATE_LIMIT;
    }

    if (msg.includes('timeout') || msg.includes('timed out')) {
      return ErrorCategory.TIMEOUT;
    }

    if (
      msg.includes('database') ||
      msg.includes('query') ||
      msg.includes('transaction') ||
      msg.includes('prisma')
    ) {
      return ErrorCategory.DATABASE;
    }

    if (msg.includes('cache') || msg.includes('redis')) {
      return ErrorCategory.CACHE;
    }

    if (msg.includes('llm') || msg.includes('model') || msg.includes('inference')) {
      return ErrorCategory.LLM;
    }

    if (msg.includes('api') || msg.includes('endpoint')) {
      return ErrorCategory.EXTERNAL_API;
    }

    return ErrorCategory.UNKNOWN;
  }

  static getStatusCode(category: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 422;
      case ErrorCategory.AUTHENTICATION:
        return 401;
      case ErrorCategory.AUTHORIZATION:
        return 403;
      case ErrorCategory.NOT_FOUND:
        return 404;
      case ErrorCategory.CONFLICT:
        return 409;
      case ErrorCategory.RATE_LIMIT:
        return 429;
      case ErrorCategory.TIMEOUT:
        return 504;
      case ErrorCategory.DATABASE:
      case ErrorCategory.CACHE:
      case ErrorCategory.LLM:
      case ErrorCategory.EXTERNAL_API:
        return 502;
      default:
        return 500;
    }
  }

  static getSeverity(category: ErrorCategory, statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
    if (statusCode === 429) return 'high';
    if (statusCode === 503) return 'critical';

    switch (category) {
      case ErrorCategory.VALIDATION:
      case ErrorCategory.NOT_FOUND:
      case ErrorCategory.AUTHENTICATION:
        return 'low';
      case ErrorCategory.CONFLICT:
      case ErrorCategory.TIMEOUT:
        return 'medium';
      case ErrorCategory.DATABASE:
      case ErrorCategory.CACHE:
      case ErrorCategory.LLM:
      case ErrorCategory.RATE_LIMIT:
        return 'high';
      default:
        return 'medium';
    }
  }

  static isRetriable(category: ErrorCategory, statusCode: number): boolean {
    const nonRetriable = [
      ErrorCategory.VALIDATION,
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.AUTHORIZATION,
      ErrorCategory.NOT_FOUND,
      ErrorCategory.CONFLICT,
    ];

    if (nonRetriable.includes(category)) return false;
    if (statusCode >= 400 && statusCode < 500) return false;

    return true;
  }

  static track(metrics: ErrorMetrics): void {
    const key = `${metrics.category}:${metrics.statusCode}`;
    const count = (this.errorCounts.get(key) || 0) + 1;
    this.errorCounts.set(key, count);

    const span = this.tracer.startSpan('error.track');
    span.setAttributes({
      'error.category': metrics.category,
      'error.status_code': metrics.statusCode,
      'error.severity': metrics.severity,
      'error.retriable': metrics.retriable,
      'error.count': count,
      ...(metrics.userId && { 'error.user_id': metrics.userId }),
      ...(metrics.requestId && { 'error.request_id': metrics.requestId }),
    });

    const logLevel =
      metrics.severity === 'critical'
        ? 'error'
        : metrics.severity === 'high'
          ? 'warn'
          : 'info';

    if (logLevel === 'error') {
      logger.error(
        {
          category: metrics.category,
          statusCode: metrics.statusCode,
          severity: metrics.severity,
          retriable: metrics.retriable,
          count,
          userId: metrics.userId,
          requestId: metrics.requestId,
          context: metrics.context,
        },
        `Error tracked: ${metrics.message}`
      );
    } else if (logLevel === 'warn') {
      logger.warn(
        {
          category: metrics.category,
          statusCode: metrics.statusCode,
          severity: metrics.severity,
          retriable: metrics.retriable,
          count,
          userId: metrics.userId,
          requestId: metrics.requestId,
          context: metrics.context,
        },
        `Error tracked: ${metrics.message}`
      );
    } else {
      logger.info(
        {
          category: metrics.category,
          statusCode: metrics.statusCode,
          severity: metrics.severity,
          retriable: metrics.retriable,
          count,
          userId: metrics.userId,
          requestId: metrics.requestId,
          context: metrics.context,
        },
        `Error tracked: ${metrics.message}`
      );
    }

    span.end();
  }

  static getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  static resetStats(): void {
    this.errorCounts.clear();
  }
}
