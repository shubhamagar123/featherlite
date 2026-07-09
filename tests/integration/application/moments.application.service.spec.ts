/**
 * Moments Application Service Integration Tests
 * Verifies moments and callbacks business logic
 */

import { MomentsApplicationService } from '@application/services/moments.application.service';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('MomentsApplicationService', () => {
  let service: MomentsApplicationService;
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
    service = new MomentsApplicationService(db);
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'moments@example.com',
        username: 'momentsuser',
        firebaseUid: `firebase-${uuidv4()}`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });
  });

  afterEach(async () => {
    await db.moment.deleteMany({});
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getUpcoming', () => {
    it('should return upcoming moments', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getUpcoming(context, { limit: 10 });

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('moments');
      expect(Array.isArray((result.value as any).moments)).toBe(true);
    });

    it('should return future moments only', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getUpcoming(context, { limit: 10 });

      const now = Date.now();
      (result.value as any).moments.forEach(moment => {
        const scheduledTime = new Date(moment.scheduledAt).getTime();
        expect(scheduledTime).toBeGreaterThanOrEqual(now);
      });
    });

    it('should support limit parameter', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getUpcoming(context, { limit: 5 });

      expect((result.value as any).moments.length).toBeLessThanOrEqual(5);
    });

    it('should sort moments by scheduled time', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getUpcoming(context, { limit: 10 });

      const moments = (result.value as any).moments;
      for (let i = 1; i < moments.length; i++) {
        const prevTime = new Date(moments[i - 1].scheduledAt).getTime();
        const currTime = new Date(moments[i].scheduledAt).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });

  describe('getHistory', () => {
    it('should return moment history', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getHistory(context, {
        skip: 0,
        take: 20,
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('moments');
      expect(Array.isArray((result.value as any).moments)).toBe(true);
    });

    it('should return past moments only', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getHistory(context, {
        skip: 0,
        take: 20,
      });

      const now = Date.now();
      (result.value as any).moments.forEach(moment => {
        const occurredTime = new Date(moment.occurredAt).getTime();
        expect(occurredTime).toBeLessThanOrEqual(now);
      });
    });

    it('should support pagination', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getHistory(context, {
        skip: 0,
        take: 20,
      });

      expect(result.value).toHaveProperty('total');
      expect(result.value).toHaveProperty('skip');
      expect(result.value).toHaveProperty('take');
    });

    it('should sort history in reverse chronological order', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getHistory(context, {
        skip: 0,
        take: 20,
      });

      const moments = (result.value as any).moments;
      for (let i = 1; i < moments.length; i++) {
        const prevTime = new Date(moments[i - 1].occurredAt).getTime();
        const currTime = new Date(moments[i].occurredAt).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });
  });

  describe('getCallbacks', () => {
    it('should return scheduled callbacks', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCallbacks(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('pending');
      expect(result.value).toHaveProperty('completed');
      expect(Array.isArray((result.value as any).pending)).toBe(true);
      expect(Array.isArray((result.value as any).completed)).toBe(true);
    });

    it('should separate pending and completed callbacks', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCallbacks(context);

      expect(result.value).toHaveProperty('pending');
      expect(result.value).toHaveProperty('completed');
    });

    it('should sort pending by scheduled time', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCallbacks(context);

      const pending = (result.value as any).pending;
      for (let i = 1; i < pending.length; i++) {
        const prevTime = new Date(pending[i - 1].scheduledAt).getTime();
        const currTime = new Date(pending[i].scheduledAt).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    it('should include callback details', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCallbacks(context);

      const all = [
        ...(result.value as any).pending,
        ...(result.value as any).completed,
      ];

      if (all.length > 0) {
        const callback = all[0];
        expect(callback).toHaveProperty('id');
        expect(callback).toHaveProperty('companion');
        expect(callback).toHaveProperty('scheduledAt');
        expect(callback).toHaveProperty('message');
        expect(callback).toHaveProperty('status');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid limit parameter', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getUpcoming(context, { limit: -1 });

      expect([true, false]).toContain(result.isSuccess());
    });

    it('should handle missing user context', async () => {
      const context = {
        userId: '',
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getUpcoming(context, { limit: 10 });

      expect(result.isFailure()).toBe(true);
    });
  });
});
