/**
 * World Application Service Integration Tests
 * Verifies world state management and scene generation business logic
 */

import { WorldApplicationService } from '@application/services/world.application.service';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('WorldApplicationService', () => {
  let service: WorldApplicationService;
  let db: PrismaClient;
  let testUser: User;

  beforeAll(async () => {
    db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });
    service = new WorldApplicationService(db);
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'world@example.com',
        username: 'worlduser',
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
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentWorld(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('id');
      expect(result.value).toHaveProperty('state');
    });

    it('should include world state properties', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentWorld(context);

      const state = (result.value as any).state;
      expect(state).toHaveProperty('context');
      expect(state).toHaveProperty('atmosphere');
      expect(state).toHaveProperty('time');
      expect(state).toHaveProperty('weather');
    });

    it('should fail for non-existent user', async () => {
      const context = {
        userId: uuidv4(),
        email: 'nonexistent@example.com',
        reqId: uuidv4(),
      };

      const result = await service.getCurrentWorld(context);

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('refreshWorld', () => {
    it('should refresh world state', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.refreshWorld(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('id');
      expect(result.value).toHaveProperty('state');
    });

    it('should update world timestamp on refresh', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const beforeRefresh = Date.now();
      const result = await service.refreshWorld(context);
      const afterRefresh = Date.now();

      const updatedAt = new Date((result.value as any).state.updatedAt).getTime();

      expect(updatedAt).toBeGreaterThanOrEqual(beforeRefresh);
      expect(updatedAt).toBeLessThanOrEqual(afterRefresh + 1000);
    });

    it('should return updated world context', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.refreshWorld(context);

      const state = (result.value as any).state;
      expect(state).toHaveProperty('context');
      expect(state).toHaveProperty('atmosphere');
    });
  });

  describe('getCurrentScene', () => {
    it('should return current scene', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentScene(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('id');
      expect(result.value).toHaveProperty('name');
      expect(result.value).toHaveProperty('description');
    });

    it('should include scene characteristics', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentScene(context);

      const scene = result.value;
      expect(scene).toHaveProperty('atmosphere');
      expect(scene).toHaveProperty('environment');
      expect(scene).toHaveProperty('characters');
      expect(scene).toHaveProperty('objects');
    });

    it('should include timing information', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentScene(context);

      const scene = result.value;
      expect(scene).toHaveProperty('timeOfDay');
      expect(scene).toHaveProperty('season');
    });
  });

  describe('getTodayWorld', () => {
    it('should return today\'s world context', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getTodayWorld(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('date');
      expect(result.value).toHaveProperty('theme');
      expect(result.value).toHaveProperty('context');
    });

    it('should return today\'s date', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getTodayWorld(context);

      const responseDate = new Date((result.value as any).date);
      const today = new Date();

      expect(responseDate.toDateString()).toBe(today.toDateString());
    });

    it('should include daily events', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getTodayWorld(context);

      expect(result.value).toHaveProperty('events');
      expect(Array.isArray((result.value as any).events)).toBe(true);
    });

    it('should include weather forecast', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getTodayWorld(context);

      expect(result.value).toHaveProperty('weather');
      expect(result.value).toHaveProperty('highlights');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user ID', async () => {
      const context = {
        userId: '',
        email: 'test@example.com',
        reqId: uuidv4(),
      };

      const result = await service.getCurrentWorld(context);

      expect(result.isFailure()).toBe(true);
    });

    it('should handle non-existent user', async () => {
      const context = {
        userId: uuidv4(),
        email: 'nonexistent@example.com',
        reqId: uuidv4(),
      };

      const result = await service.getCurrentWorld(context);

      expect(result.isFailure()).toBe(true);
    });
  });
});
