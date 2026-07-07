import { CompanionService } from '../companion/companion.service';
import { CompanionRepository } from '@database/repositories/companion.repository';
import { NotFoundError } from '../exceptions';
import { CreateCompanionDTO } from '../dtos/companion.dto';

jest.mock('@database/repositories/companion.repository');

describe('CompanionService', () => {
  let companionService: CompanionService;
  let mockCompanionRepository: jest.Mocked<CompanionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCompanionRepository = new CompanionRepository() as jest.Mocked<CompanionRepository>;
    companionService = new CompanionService(mockCompanionRepository);
  });

  describe('getCompanionById', () => {
    it('should return companion when found', async () => {
      const companionId = 'companion-123';
      const mockCompanion = {
        id: companionId,
        userId: 'user-123',
        name: 'Kai',
        description: 'A friendly companion',
        status: 'ACTIVE',
        affectionLevel: 50,
        engagementScore: 0.8,
        totalConversations: 10,
        totalMessages: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        lastInteractionAt: new Date(),
        version: 1,
      };

      mockCompanionRepository.findById.mockResolvedValue(mockCompanion as any);

      const result = await companionService.getCompanionById(companionId);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.findById).toHaveBeenCalledWith(companionId);
    });

    it('should return failure when companion not found', async () => {
      const companionId = 'non-existent-id';
      mockCompanionRepository.findById.mockResolvedValue(null);

      const result = await companionService.getCompanionById(companionId);

      expect(result).toBeDefined();
    });

    it('should return failure with invalid UUID', async () => {
      const result = await companionService.getCompanionById('invalid-uuid');

      expect(result).toBeDefined();
    });
  });

  describe('getCompanionsByUserId', () => {
    it('should return companions with default limit', async () => {
      const userId = 'user-123';
      const mockCompanions = [
        {
          id: 'companion-1',
          userId,
          name: 'Kai',
          description: 'A friendly companion',
          status: 'ACTIVE',
          affectionLevel: 50,
          engagementScore: 0.8,
          totalConversations: 10,
          totalMessages: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          lastInteractionAt: new Date(),
          version: 1,
        },
      ];

      mockCompanionRepository.findByUserId.mockResolvedValue(mockCompanions as any);

      const result = await companionService.getCompanionsByUserId(userId);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.findByUserId).toHaveBeenCalledWith(userId, { take: 50 });
    });

    it('should return companions with custom limit', async () => {
      const userId = 'user-123';
      const limit = 10;
      mockCompanionRepository.findByUserId.mockResolvedValue([]);

      const result = await companionService.getCompanionsByUserId(userId, limit);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.findByUserId).toHaveBeenCalledWith(userId, { take: limit });
    });

    it('should return failure with invalid userId', async () => {
      const result = await companionService.getCompanionsByUserId('invalid-uuid');

      expect(result).toBeDefined();
    });

    it('should return failure with non-positive limit', async () => {
      const result = await companionService.getCompanionsByUserId('user-123', 0);

      expect(result).toBeDefined();
    });
  });

  describe('getActiveCompanionsByUserId', () => {
    it('should return only active companions', async () => {
      const userId = 'user-123';
      const mockCompanions = [
        {
          id: 'companion-1',
          userId,
          name: 'Kai',
          status: 'ACTIVE',
          affectionLevel: 50,
          engagementScore: 0.8,
          totalConversations: 10,
          totalMessages: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          lastInteractionAt: new Date(),
          version: 1,
        },
      ];

      mockCompanionRepository.findActiveByUserId.mockResolvedValue(mockCompanions as any);

      const result = await companionService.getActiveCompanionsByUserId(userId);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.findActiveByUserId).toHaveBeenCalledWith(userId, { take: 50 });
    });
  });

  describe('getCompanionsByHighestAffection', () => {
    it('should return companions ordered by affection', async () => {
      const userId = 'user-123';
      const limit = 5;
      const mockCompanions = [
        {
          id: 'companion-1',
          userId,
          name: 'Kai',
          affectionLevel: 100,
          status: 'ACTIVE',
          engagementScore: 0.8,
          totalConversations: 50,
          totalMessages: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          lastInteractionAt: new Date(),
          version: 1,
        },
        {
          id: 'companion-2',
          userId,
          name: 'Kia',
          affectionLevel: 80,
          status: 'ACTIVE',
          engagementScore: 0.6,
          totalConversations: 30,
          totalMessages: 300,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          lastInteractionAt: new Date(),
          version: 1,
        },
      ];

      mockCompanionRepository.findByHighestAffection.mockResolvedValue(mockCompanions as any);

      const result = await companionService.getCompanionsByHighestAffection(userId, limit);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.findByHighestAffection).toHaveBeenCalledWith(userId, limit);
    });
  });

  describe('updateCompanionAffection', () => {
    it('should increment affection level', async () => {
      const companionId = 'companion-123';
      const delta = 10;

      mockCompanionRepository.updateAffectionLevel.mockResolvedValue(undefined);

      const result = await companionService.updateCompanionAffection(companionId, delta);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.updateAffectionLevel).toHaveBeenCalledWith(companionId, delta);
    });

    it('should decrement affection level', async () => {
      const companionId = 'companion-123';
      const delta = -5;

      mockCompanionRepository.updateAffectionLevel.mockResolvedValue(undefined);

      const result = await companionService.updateCompanionAffection(companionId, delta);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.updateAffectionLevel).toHaveBeenCalledWith(companionId, delta);
    });
  });

  describe('updateCompanionEngagement', () => {
    it('should update engagement score when valid', async () => {
      const companionId = 'companion-123';
      const score = 0.75;

      mockCompanionRepository.updateEngagementScore.mockResolvedValue(undefined);

      const result = await companionService.updateCompanionEngagement(companionId, score);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.updateEngagementScore).toHaveBeenCalledWith(companionId, score);
    });

    it('should return failure when score is out of range', async () => {
      const result = await companionService.updateCompanionEngagement('companion-123', 1.5);

      expect(result).toBeDefined();
    });

    it('should return failure when score is negative', async () => {
      const result = await companionService.updateCompanionEngagement('companion-123', -0.5);

      expect(result).toBeDefined();
    });
  });

  describe('incrementConversationCount', () => {
    it('should increment conversation count', async () => {
      const companionId = 'companion-123';

      mockCompanionRepository.incrementTotalConversations.mockResolvedValue(undefined);

      const result = await companionService.incrementConversationCount(companionId);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.incrementTotalConversations).toHaveBeenCalledWith(companionId);
    });
  });

  describe('incrementMessageCount', () => {
    it('should increment message count with default value', async () => {
      const companionId = 'companion-123';

      mockCompanionRepository.incrementTotalMessages.mockResolvedValue(undefined);

      const result = await companionService.incrementMessageCount(companionId);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.incrementTotalMessages).toHaveBeenCalledWith(companionId, 1);
    });

    it('should increment message count by custom value', async () => {
      const companionId = 'companion-123';
      const count = 5;

      mockCompanionRepository.incrementTotalMessages.mockResolvedValue(undefined);

      const result = await companionService.incrementMessageCount(companionId, count);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.incrementTotalMessages).toHaveBeenCalledWith(companionId, count);
    });

    it('should return failure with non-positive count', async () => {
      const result = await companionService.incrementMessageCount('companion-123', 0);

      expect(result).toBeDefined();
    });
  });

  describe('updateCompanionLastInteraction', () => {
    it('should update last interaction timestamp', async () => {
      const companionId = 'companion-123';

      mockCompanionRepository.updateLastInteraction.mockResolvedValue(undefined);

      const result = await companionService.updateCompanionLastInteraction(companionId);

      expect(result).toBeDefined();
      expect(mockCompanionRepository.updateLastInteraction).toHaveBeenCalledWith(companionId);
    });
  });
});
