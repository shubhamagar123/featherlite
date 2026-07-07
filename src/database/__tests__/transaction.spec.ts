import { transaction, transactionWithIsolation, transactionWithTimeout, executeInTransaction } from '../transaction';
import { prisma } from '../prisma';

jest.mock('../prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

describe('Transaction Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('transaction', () => {
    it('should execute callback within transaction', async () => {
      const mockCallback = jest.fn(async (client) => {
        return 'result';
      });

      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        Promise.resolve(callback(prisma))
      );

      const result = await transaction(mockCallback);

      expect(result).toBe('result');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const error = new Error('Transaction failed');
      (prisma.$transaction as jest.Mock).mockRejectedValue(error);

      await expect(transaction(async () => {})).rejects.toThrow('Transaction failed');
    });
  });

  describe('transactionWithIsolation', () => {
    it('should execute with specified isolation level', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation((callback, options) =>
        Promise.resolve(callback(prisma))
      );

      const result = await transactionWithIsolation(async () => 'result', 'Serializable');

      expect(result).toBe('result');
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: 'Serializable' }
      );
    });
  });

  describe('transactionWithTimeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should timeout if transaction exceeds time limit', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('result'), 10000))
      );

      const promise = transactionWithTimeout(async () => 'result', 1000);

      jest.advanceTimersByTime(1001);

      await expect(promise).rejects.toThrow('Transaction timeout');
    });
  });

  describe('executeInTransaction', () => {
    it('should execute multiple operations in transaction', async () => {
      const op1 = jest.fn(async () => 'result1');
      const op2 = jest.fn(async () => 'result2');

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      const operations = [
        { name: 'operation1', fn: op1 },
        { name: 'operation2', fn: op2 },
      ];

      const result = await executeInTransaction(operations);

      expect(result).toHaveLength(2);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should rollback all operations on error', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Multi-op failed'));

      const operations = [
        { name: 'op1', fn: jest.fn() },
        { name: 'op2', fn: jest.fn() },
      ];

      await expect(executeInTransaction(operations)).rejects.toThrow('Multi-op failed');
    });
  });
});
