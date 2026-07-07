import pino, { type Logger } from 'pino';
import { environment } from '@config/environment';

const pinoConfig = {
  level: environment.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger: Logger = pino(pinoConfig);

export function createLogger(name: string): Logger {
  return logger.child({ module: name });
}

export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (error instanceof Error) {
    logger.error(
      {
        ...context,
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
      error.message
    );
  } else {
    logger.error(context || error, 'Unknown error occurred');
  }
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  logger.info(context, message);
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  logger.warn(context, message);
}

export function logDebug(message: string, context?: Record<string, unknown>): void {
  logger.debug(context, message);
}
