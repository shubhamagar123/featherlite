import { CompanionRepository } from '../../repositories/companion.repository';
import { prisma } from '../../prisma';

jest.mock('../../prisma', () => ({
  prisma: {
    companion: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('CompanionRepository', () => {
  let repository: CompanionRepository;

  beforeEach(() => {
    repository = new CompanionRepository();
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should find companions by userId', async () => {
      const mockCompanions = [
        {
          id: '1',
          userId: 'user1',
          name: 'Companion1',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.companion.findMany as jest.Mock).mockResolvedValue(mockCompanions);

      const result = await repository.findByUserId('user1');

      expect(result).toEqual(mockCompanions);
    });
  });

  describe('findActiveByUserId', () => {
    it('should find active companions for user', async () => {
      const mockCompanions = [
        {
          id: '1',
          userId: 'user1',
          name: 'Companion1',
          status: 'ACTIVE',
        },
      ];

      (prisma.companion.findMany as jest.Mock).mockResolvedValue(mockCompanions);

      const result = await repository.findActiveByUserId('user1');

      expect(result).toEqual(mockCompanions);
    });
  });

  describe('incrementTotalConversations', () => {
    it('should increment total conversations count', async () => {
      const mockCompanion = {
        id: '1',
        totalConversations: 11,
      };

      (prisma.companion.update as jest.Mock).mockResolvedValue(mockCompanion);

      const result = await repository.incrementTotalConversations('1');

      expect(result).toEqual(mockCompanion);
      expect(prisma.companion.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { totalConversations: { increment: 1 } },
      });
    });
  });

  describe('updateAffectionLevel', () => {
    it('should update affection level by delta', async () => {
      const mockCompanion = {
        id: '1',
        affectionLevel: 25,
      };

      (prisma.companion.update as jest.Mock).mockResolvedValue(mockCompanion);

      const result = await repository.updateAffectionLevel('1', 25);

      expect(result).toEqual(mockCompanion);
      expect(prisma.companion.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { affectionLevel: { increment: 25 } },
      });
    });
  });

  describe('updateEngagementScore', () => {
    it('should update engagement score', async () => {
      const mockCompanion = {
        id: '1',
        engagementScore: 0.75,
      };

      (prisma.companion.update as jest.Mock).mockResolvedValue(mockCompanion);

      const result = await repository.updateEngagementScore('1', 0.75);

      expect(result).toEqual(mockCompanion);
      expect(prisma.companion.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { engagementScore: 0.75 },
      });
    });
  });

  describe('findByHighestAffection', () => {
    it('should find companions ordered by highest affection', async () => {
      const mockCompanions = [
        { id: '1', affectionLevel: 50 },
        { id: '2', affectionLevel: 30 },
      ];

      (prisma.companion.findMany as jest.Mock).mockResolvedValue(mockCompanions);

      const result = await repository.findByHighestAffection('user1', 10);

      expect(result).toEqual(mockCompanions);
    });
  });

  describe('countActiveByUserId', () => {
    it('should count active companions for user', async () => {
      (prisma.companion.count as jest.Mock).mockResolvedValue(3);

      const result = await repository.countActiveByUserId('user1');

      expect(result).toBe(3);
    });
  });

  describe('existsByUserIdAndName', () => {
    it('should return true if companion exists with given name', async () => {
      (prisma.companion.findFirst as jest.Mock).mockResolvedValue({ id: '1' });

      const result = await repository.existsByUserIdAndName('user1', 'CompanionName');

      expect(result).toBe(true);
    });

    it('should return false if companion does not exist', async () => {
      (prisma.companion.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.existsByUserIdAndName('user1', 'NonExistent');

      expect(result).toBe(false);
    });
  });
});
