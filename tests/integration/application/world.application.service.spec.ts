/**
 * World Application Service Integration Tests
 * Verifies world state management and scene generation business logic
 *
 * NOTE: WorldApplicationService is currently a deliberate stub — every
 * method returns fixed, hardcoded world/scene data with no user lookup or
 * persistence. These tests verify that current, accurate behavior.
 */

import { WorldApplicationService } from '@application/services/world.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('WorldApplicationService', () => {
  let service: WorldApplicationService;
  let db: PrismaClient;
  let testUser: User;

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
    service = new WorldApplicationService();
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: `world-${uuidv4()}@example.com`,
        username: `worlduser-${uuidv4().slice(0, 8)}`,
        firebaseUid: `firebase-${uuidv4()}`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });
  });

  afterEach(async () => {
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getCurrentWorld', () => {
    it('should return current world state', async () => {
      const result = await service.getCurrentWorld(buildContext());

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('theme');
      expect(result).toHaveProperty('status', 'active');
    });

    it('should include timestamps', async () => {
      const result = await service.getCurrentWorld(buildContext());

      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('refreshWorld', () => {
    it('should refresh world state', async () => {
      const result = await service.refreshWorld(buildContext());

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'active');
    });

    it('should set a fresh refreshedAt timestamp', async () => {
      const beforeRefresh = Date.now();
      const result = await service.refreshWorld(buildContext());
      const afterRefresh = Date.now();

      const refreshedAt = new Date((result as any).refreshedAt).getTime();

      expect(refreshedAt).toBeGreaterThanOrEqual(beforeRefresh);
      expect(refreshedAt).toBeLessThanOrEqual(afterRefresh + 1000);
    });
  });

  describe('getCurrentScene', () => {
    it('should return the current scene', async () => {
      const result = await service.getCurrentScene(buildContext());

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
    });

    it('should include scene characteristics', async () => {
      const result = await service.getCurrentScene(buildContext());

      expect(result).toHaveProperty('setting');
      expect(result).toHaveProperty('mood');
      expect(result).toHaveProperty('activities');
      expect(Array.isArray((result as any).activities)).toBe(true);
    });
  });

  describe("getTodayWorld", () => {
    it("should return today's world context", async () => {
      const result = await service.getTodayWorld(buildContext());

      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('weather');
      expect(result).toHaveProperty('activities');
    });

    it("should return today's date", async () => {
      const result = await service.getTodayWorld(buildContext());

      const responseDate = new Date((result as any).date);
      const today = new Date();

      expect(responseDate.toDateString()).toBe(today.toDateString());
    });

    it('should include an activities array', async () => {
      const result = await service.getTodayWorld(buildContext());

      expect(Array.isArray((result as any).activities)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should not throw for a missing user ID (stub does not validate)', async () => {
      const context = buildContext({ userId: '' });

      await expect(service.getCurrentWorld(context)).resolves.toBeDefined();
    });

    it('should not throw for a non-existent user (stub does not validate)', async () => {
      const context = buildContext({ userId: uuidv4() });

      await expect(service.getCurrentWorld(context)).resolves.toBeDefined();
    });
  });
});
