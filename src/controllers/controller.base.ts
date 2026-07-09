import { Request, Response } from 'express';
import { ResponseBuilder } from '@application/dtos/application.response';
import { ApplicationException } from '@application/exceptions/application.exceptions';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

/**
 * Base Controller
 * All controllers inherit from this
 * Minimal logic: validate, call service, return response
 */
export abstract class ControllerBase {
  protected readonly logger: Logger;

  constructor(controllerName: string) {
    this.logger = createLogger(controllerName);
  }

  /**
   * Get trace ID from request
   */
  protected getTraceId(req: Request): string {
    return req.id || req.get('x-trace-id') || `trace_${Date.now()}`;
  }

  /**
   * Get user context from request
   */
  protected getUserContext(req: Request): { userId?: string; userRoles: string[] } {
    return {
      userId: (req.user as any)?.uid,
      userRoles: ((req.user as any)?.customClaims?.roles as string[]) || [],
    };
  }

  /**
   * Success response
   */
  protected success<T>(res: Response, data: T, traceId: string, statusCode = 200): Response {
    return res.status(statusCode).json(ResponseBuilder.success(data, traceId));
  }

  /**
   * Paginated response
   */
  protected paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    traceId: string
  ): Response {
    return res.status(200).json(ResponseBuilder.paginated(data, page, limit, total, traceId));
  }

  /**
   * Error response
   */
  protected error(res: Response, error: unknown, traceId: string): Response {
    if (error instanceof ApplicationException) {
      return res.status(error.statusCode).json(
        ResponseBuilder.error(error.code, error.message, traceId, error.details)
      );
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json(ResponseBuilder.error('INTERNAL_ERROR', message, traceId));
  }

  /**
   * Log request
   */
  protected logRequest(method: string, path: string, context?: Record<string, unknown>): void {
    this.logger.info({ method, path, ...context }, `${method} ${path}`);
  }

  /**
   * Log error
   */
  protected logRequestError(
    method: string,
    path: string,
    error: unknown,
    context?: Record<string, unknown>
  ): void {
    this.logger.error(
      { method, path, error, ...context },
      `${method} ${path} - Error`
    );
  }
}
