import { logger } from '@utils/logger';
import { ServiceException } from '../exceptions';

export abstract class BaseService {
  protected serviceLogger = logger.child({ module: this.constructor.name });

  protected logInfo(message: string, data?: Record<string, any>): void {
    this.serviceLogger.info(data, message);
  }

  protected logError(error: Error | ServiceException, message: string): void {
    this.serviceLogger.error(
      {
        error,
        errorCode: error instanceof ServiceException ? error.code : 'UNKNOWN',
        errorDetails: error instanceof ServiceException ? error.details : undefined,
      },
      message
    );
  }

  protected logWarn(message: string, data?: Record<string, any>): void {
    this.serviceLogger.warn(data, message);
  }

  protected logDebug(message: string, data?: Record<string, any>): void {
    this.serviceLogger.debug(data, message);
  }

  protected logBusinessEvent(event: string, context: Record<string, any>): void {
    this.serviceLogger.info(
      {
        event,
        ...context,
      },
      `Business event: ${event}`
    );
  }
}
