import { IResult } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

/**
 * Base Application Service
 * All application services inherit from this.
 * Orchestrates engines and handles use cases.
 */
export abstract class ApplicationServiceBase {
  protected readonly logger: Logger;

  constructor(serviceName: string) {
    this.logger = createLogger(serviceName);
  }

  /**
   * Log operation start
   */
  protected logStart(operation: string, context?: Record<string, unknown>): void {
    this.logger.info(context || {}, `Starting: ${operation}`);
  }

  /**
   * Log operation success
   */
  protected logSuccess(operation: string, context?: Record<string, unknown>): void {
    this.logger.info(context || {}, `Success: ${operation}`);
  }

  /**
   * Log operation error
   */
  protected logError(operation: string, error: unknown, context?: Record<string, unknown>): void {
    this.logger.error({ error, ...context }, `Error: ${operation}`);
  }

  /**
   * Handle service result
   */
  protected handleResult<T>(result: IResult<T>): T {
    if (!result.isSuccess) {
      throw result.error || new Error('Operation failed');
    }
    return result.value;
  }

  /**
   * Validate authorization
   */
  protected requireAuthentication(userId?: string): void {
    if (!userId) {
      throw new Error('UNAUTHENTICATED: User must be authenticated');
    }
  }

  /**
   * Validate role-based access
   */
  protected requireRole(userRoles?: string[], requiredRoles?: string[]): void {
    if (!userRoles || !requiredRoles) return;

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new Error('FORBIDDEN: User does not have required role');
    }
  }
}
