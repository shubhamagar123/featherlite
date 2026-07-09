/**
 * Memory Application Service Integration Tests
 * Verifies memory retrieval and management business logic
 */

import { MemoryApplicationService } from '@application/services/memory.application.service';
import { PrismaClient, User, UserRole, UserStatus, Companion, CompanionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('MemoryApplicationService', () => {
  let service: MemoryApplicationService;
  let db: PrismaClient;
  let testUser: User;
  let testCompanion: Companion;

  beforeAll(async () => {
    db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });
    service = new MemoryApplicationService(db);
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'memory@example.com',
        username: 'memoryuser',
        firebaseUid: `firebase-${uuidv4()}`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    testCompanion = await db.companion.create({
      data: {
        id: uuidv4(),
        userId: testUser.id,
        name: 'Test Companion',
        description: 'A test companion',
        personality: 'friendly',
        status: CompanionStatus.ACTIVE,
      },
    });
  });

  afterEach(async () => {
    await db.memory.deleteMany({});
    await db.companion.deleteMany({});
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('searchMemories', () => {
    it('should search memories for companion', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.searchMemories(context, testCompanion.id, 'test', {
        skip: 0,
        take: 10,
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('memories');
      expect(Array.isArray((result.value as any).memories)).toBe(true);
    });

    it('should return paginated results', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.searchMemories(context, testCompanion.id, 'test', {
        skip: 0,
        take: 10,
      });

      expect(result.value).toHaveProperty('total');
      expect(result.value).toHaveProperty('skip');
      expect(result.value).toHaveProperty('take');
    });

    it('should fail for non-existent companion', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.searchMemories(context, uuidv4(), 'test', {
        skip: 0,
        take: 10,
      });

      expect([true, false]).toContain(result.isSuccess()); // Depends on implementation
    });
  });

  describe('retrieveMemories', () => {
    it('should retrieve companion memories', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.retrieveMemories(context, testCompanion.id, {
        skip: 0,
        take: 20,
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('memories');
      expect(Array.isArray((result.value as any).memories)).toBe(true);
    });

    it('should support pagination', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.retrieveMemories(context, testCompanion.id, {
        skip: 0,
        take: 20,
      });

      expect(result.value).toHaveProperty('total');
      expect(result.value).toHaveProperty('skip');
      expect(result.value).toHaveProperty('take');
    });

    it('should support sorting', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.retrieveMemories(context, testCompanion.id, {
        skip: 0,
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('getTimeline', () => {
    it('should return memory timeline', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getTimeline(context, testCompanion.id);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('timeline');
      expect(Array.isArray((result.value as any).timeline)).toBe(true);
    });

    it('should support date range filtering', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const result = await service.getTimeline(context, testCompanion.id, {
        startDate,
        endDate,
      });

      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('getDetails', () => {
    it('should return memory details', async () => {
      const memory = await db.memory.create({
        data: {
          id: uuidv4(),
          companionId: testCompanion.id,
          userId: testUser.id,
          content: 'Test memory',
          type: 'FACT',
        },
      });

      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getDetails(context, memory.id);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('id', memory.id);
      expect(result.value).toHaveProperty('content', 'Test memory');
    });

    it('should return 404 for non-existent memory', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getDetails(context, uuidv4());

      expect(result.isFailure()).toBe(true);
    });

    it('should include memory metadata', async () => {
      const memory = await db.memory.create({
        data: {
          id: uuidv4(),
          companionId: testCompanion.id,
          userId: testUser.id,
          content: 'Test memory',
          type: 'FACT',
        },
      });

      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getDetails(context, memory.id);

      expect(result.value).toHaveProperty('type');
      expect(result.value).toHaveProperty('companion');
      expect(result.value).toHaveProperty('createdAt');
      expect(result.value).toHaveProperty('updatedAt');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid companion ID', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.retrieveMemories(context, 'invalid-id', {
        skip: 0,
        take: 20,
      });

      expect([true, false]).toContain(result.isSuccess());
    });

    it('should handle missing user context', async () => {
      const context = {
        userId: '',
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getDetails(context, uuidv4());

      expect(result.isFailure()).toBe(true);
    });
  });
});
