import { logger } from '@utils/logger';
import { ServiceException } from '../exceptions';

/**
 * Fields safe to include in structured business-event logs.
 * Intentionally narrow to prevent PII (email, name, content) from leaking into logs.
 */
const SAFE_EVENT_FIELDS = new Set<string>([
  'userId',
  'companionId',
  'relationshipId',
  'momentId',
  'memoryId',
  'conversationId',
  'eventType',
  'action',
  'status',
  'level',
  'count',
  'duration',
  'success',
  'errorCode',
  'requestId',
  'traceId',
]);

export abstract class BaseService {
  /**
   * Subclasses should override this with a literal string to guard against
   * constructor.name mangling in minified production builds.
   *
   * @example
   * protected readonly loggerName = 'UserService';
   */
  protected readonly loggerName: string = this.constructor.name;

  private _serviceLogger?: ReturnType<typeof logger.child>;

  /** Lazily-initialized child logger; reads loggerName after all constructors run. */
  protected get serviceLogger(): ReturnType<typeof logger.child> {
    return (this._serviceLogger ??= logger.child({ module: this.loggerName }));
  }

  protected logInfo(message: string, data?: Record<string, unknown>): void {
    this.serviceLogger.info(data, message);
  }

  protected logError(error: Error | ServiceException | unknown, message: string): void {
    const isServiceEx = error instanceof ServiceException;
    const isError = error instanceof Error;
    this.serviceLogger.error(
      {
        error,
        errorCode: isServiceEx ? error.code : 'UNKNOWN',
        errorDetails: isServiceEx ? error.details : undefined,
        // Preserve the original cause chain so stack traces survive re-wrapping.
        // Cast through unknown because Error.cause requires ES2022 lib typings.
        cause: isError ? (error as unknown as { cause?: unknown }).cause : undefined,
      },
      message
    );
  }

  protected logWarn(message: string, data?: Record<string, unknown>): void {
    this.serviceLogger.warn(data, message);
  }

  protected logDebug(message: string, data?: Record<string, unknown>): void {
    this.serviceLogger.debug(data, message);
  }

  /**
   * Logs a business event with an allowlisted subset of context fields.
   * Only fields listed in SAFE_EVENT_FIELDS are forwarded to prevent PII leakage.
   */
  protected logBusinessEvent(event: string, context: Record<string, unknown>): void {
    const safeContext: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      if (SAFE_EVENT_FIELDS.has(key)) {
        safeContext[key] = value;
      }
    }
    this.serviceLogger.info({ event, ...safeContext }, `Business event: ${event}`);
  }

  /**
   * Wraps an unknown caught value in an Error with a `cause` property so the
   * original stack trace is preserved rather than discarded.
   *
   * Uses a manual assignment because `new Error(msg, { cause })` requires ES2022
   * lib typings while this project targets ES2020.
   */
  protected wrapError(cause: unknown, message: string): Error {
    const error = new Error(message);
    (error as Error & { cause?: unknown }).cause = cause;
    return error;
  }
}
