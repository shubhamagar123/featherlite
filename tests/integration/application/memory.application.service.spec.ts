/**
 * Memory Application Service Integration Tests
 * Verifies memory retrieval and management business logic
 */

import { MemoryApplicationService } from '@application/services/memory.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { PrismaClient, User, UserRole, UserStatus, Companion, CompanionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('MemoryApplicationService', () => {
  let service: MemoryApplicationService;
  let db: PrismaClient;
  let testUser: User;
  let testCompanion: Companion;

  const buildContext = (overrides: Partial<ApplicationContext> = {}): ApplicationContext => ({
    userId: testUser.id,
    userEmail: testUser.email,
    userRoles: [],
    requestId: uuidv4(),
    traceId: uuidv4(),
    timestamp: new Date(),
    ...overrides,
  });

  beforeAll(async () => {
    db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });
    service = new MemoryApplicationService();
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: `memory-${uuidv4()}@example.com`,
        username: `memoryuser-${uuidv4().slice(0, 8)}`,
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
    it('should search memories for a companion and return an array', async () => {
      const result = await service.searchMemories(buildContext(), testCompanion.id, 'test', 10);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should respect the limit argument', async () => {
      const result = await service.searchMemories(buildContext(), testCompanion.id, 'test', 5);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should fail for non-existent companion', async () => {
      await expect(service.searchMemories(buildContext(), uuidv4(), 'test', 10)).rejects.toThrow();
    });
  });

  describe('retrieveMemories', () => {
    it('should retrieve companion memories as an array', async () => {
      const result = await service.retrieveMemories(buildContext(), testCompanion.id, {}, 20);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return the memories that were created for the companion', async () => {
      await db.memory.create({
        data: {
          id: uuidv4(),
          companionId: testCompanion.id,
          userId: testUser.id,
          content: 'A shared memory',
          type: 'EPISODIC',
        },
      });

      const result = await service.retrieveMemories(buildContext(), testCompanion.id, {}, 20);

      expect(result.some((m) => m.content === 'A shared memory')).toBe(true);
    });

    it('should fail for non-existent companion', async () => {
      await expect(service.retrieveMemories(buildContext(), uuidv4(), {}, 20)).rejects.toThrow();
    });
  });

  describe('getMemoryTimeline', () => {
    it('should return the memory timeline as an array ordered by newest first', async () => {
      const older = await db.memory.create({
        data: {
          id: uuidv4(),
          companionId: testCompanion.id,
          userId: testUser.id,
          content: 'Older memory',
          type: 'EPISODIC',
          createdAt: new Date(Date.now() - 60_000),
        },
      });
      const newer = await db.memory.create({
        data: {
          id: uuidv4(),
          companionId: testCompanion.id,
          userId: testUser.id,
          content: 'Newer memory',
          type: 'EPISODIC',
        },
      });

      const result = await service.getMemoryTimeline(buildContext(), testCompanion.id, 100);

      expect(Array.isArray(result)).toBe(true);
      const ids = result.map((m) => m.id);
      expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
    });

    it('should fail for non-existent companion', async () => {
      await expect(service.getMemoryTimeline(buildContext(), uuidv4(), 100)).rejects.toThrow();
    });
  });

  describe('getMemoryDetails', () => {
    it('should return memory details', async () => {
      const memory = await db.memory.create({
        data: {
          id: uuidv4(),
          companionId: testCompanion.id,
          userId: testUser.id,
          content: 'Test memory',
          type: 'EPISODIC',
        },
      });

      const result = await service.getMemoryDetails(buildContext(), memory.id);

      expect(result).toHaveProperty('id', memory.id);
      expect(result).toHaveProperty('content', 'Test memory');
    });

    it('should return 404 for non-existent memory', async () => {
      await expect(service.getMemoryDetails(buildContext(), uuidv4())).rejects.toThrow();
    });

    it('should include memory metadata', async () => {
      const memory = await db.memory.create({
        data: {
          id: uuidv4(),
          companionId: testCompanion.id,
          userId: testUser.id,
          content: 'Test memory',
          type: 'EPISODIC',
        },
      });

      const result = await service.getMemoryDetails(buildContext(), memory.id);

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('companionId', testCompanion.id);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should increment access count on each read', async () => {
      const memory = await db.memory.create({
        data: {
          id: uuidv4(),
          companionId: testCompanion.id,
          userId: testUser.id,
          content: 'Test memory',
          type: 'EPISODIC',
        },
      });

      const first = await service.getMemoryDetails(buildContext(), memory.id);
      const second = await service.getMemoryDetails(buildContext(), memory.id);

      expect(second.accessCount).toBeGreaterThan(first.accessCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid companion ID', async () => {
      await expect(service.retrieveMemories(buildContext(), 'invalid-id', {}, 20)).rejects.toThrow();
    });

    it('should handle missing user context', async () => {
      const context = buildContext({ userId: '' });

      await expect(service.getMemoryDetails(context, uuidv4())).rejects.toThrow();
    });
  });
});
