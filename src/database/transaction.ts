import { prisma } from './prisma';
import { logger } from '@utils/logger';

const txLogger = logger.child({ module: 'transaction' });

export interface TransactionContext {
  rollback: () => Promise<void>;
}

type TransactionCallback<T> = (client: typeof prisma) => Promise<T>;

export async function transaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const txId = Math.random().toString(36).substring(7);

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
  const txId = Math.random().toString(36).substring(7);

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

export async function transactionWithTimeout<T>(
  callback: TransactionCallback<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const txId = Math.random().toString(36).substring(7);

  return Promise.race([
    transaction(callback),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        txLogger.warn({ txId, timeoutMs }, 'Transaction timeout');
        reject(new Error(`Transaction timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

export async function executeInTransaction<T>(
  operations: Array<{
    name: string;
    fn: (client: typeof prisma) => Promise<any>;
  }>
): Promise<T[]> {
  const txId = Math.random().toString(36).substring(7);

  try {
    txLogger.debug({ txId, operationCount: operations.length }, 'Multi-operation transaction started');

    const results = await prisma.$transaction(
      async (client) => {
        const txResults: any[] = [];

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
    return results;
  } catch (error) {
    txLogger.error(
      { error, txId, operationCount: operations.length },
      'Multi-operation transaction rolled back'
    );
    throw error;
  }
}
