import { randomUUID } from 'crypto';
import { prisma } from './prisma';
import { logger } from '@utils/logger';

const txLogger = logger.child({ module: 'transaction' });

export interface TransactionContext {
  rollback: () => Promise<void>;
}

type TransactionCallback<T> = (client: typeof prisma) => Promise<T>;

export async function transaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const txId = randomUUID();

  try {
    txLogger.debug({ txId }, 'Transaction started');

    const result = await prisma.$transaction(async (client) => {
      return await callback(client as typeof prisma);
    });

    txLogger.debug({ txId }, 'Transaction committed');
    return result;
  } catch (error) {
    txLogger.error({ error, txId }, 'Transaction rolled back');
    throw error;
  }
}

export async function transactionWithIsolation<T>(
  callback: TransactionCallback<T>,
  isolationLevel: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable' = 'ReadCommitted'
): Promise<T> {
  const txId = randomUUID();

  try {
    txLogger.debug({ txId, isolationLevel }, 'Isolated transaction started');

    const result = await prisma.$transaction(
      async (client) => {
        return await callback(client as typeof prisma);
      },
      {
        isolationLevel,
      }
    );

    txLogger.debug({ txId, isolationLevel }, 'Isolated transaction committed');
    return result;
  } catch (error) {
    txLogger.error({ error, txId, isolationLevel }, 'Isolated transaction rolled back');
    throw error;
  }
}

/**
 * Runs a transaction with a hard timeout using Prisma's native `$transaction` timeout
 * option. Unlike a Promise.race approach, this lets Prisma clean up the underlying
 * DB connection cleanly when the timeout fires.
 */
export async function transactionWithTimeout<T>(
  callback: TransactionCallback<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const txId = randomUUID();

  try {
    txLogger.debug({ txId, timeoutMs }, 'Timeout-bounded transaction started');

    const result = await prisma.$transaction(
      async (client) => callback(client as typeof prisma),
      { timeout: timeoutMs }
    );

    txLogger.debug({ txId, timeoutMs }, 'Timeout-bounded transaction committed');
    return result;
  } catch (error) {
    txLogger.error({ error, txId, timeoutMs }, 'Timeout-bounded transaction rolled back');
    throw error;
  }
}

export async function executeInTransaction<T>(
  operations: Array<{
    name: string;
    fn: (client: typeof prisma) => Promise<unknown>;
  }>
): Promise<T[]> {
  const txId = randomUUID();

  try {
    txLogger.debug({ txId, operationCount: operations.length }, 'Multi-operation transaction started');

    const results = await prisma.$transaction(
      async (client) => {
        const txResults: unknown[] = [];

        for (const operation of operations) {
          txLogger.debug({ txId, operation: operation.name }, 'Executing operation in transaction');
          const result = await operation.fn(client as typeof prisma);
          txResults.push(result);
        }

        return txResults;
      },
      { maxWait: 2000, timeout: 10000 }
    );

    txLogger.debug({ txId, operationCount: operations.length }, 'Multi-operation transaction committed');
    return results as T[];
  } catch (error) {
    txLogger.error(
      { error, txId, operationCount: operations.length },
      'Multi-operation transaction rolled back'
    );
    throw error;
  }
}
