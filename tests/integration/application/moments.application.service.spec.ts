/**
 * Moments Application Service Integration Tests
 * Verifies moments and callbacks business logic
 *
 * NOTE: MomentsApplicationService is currently a deliberate stub — every
 * method returns an empty array unconditionally (no Moment/callback
 * persistence is wired up yet). These tests verify that current, accurate
 * behavior rather than real filtering/sorting, which doesn't exist yet.
 */

import { MomentsApplicationService } from '@application/services/moments.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('MomentsApplicationService', () => {
  let service: MomentsApplicationService;
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
    service = new MomentsApplicationService();
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: `moments-${uuidv4()}@example.com`,
        username: `momentsuser-${uuidv4().slice(0, 8)}`,
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

  describe('getUpcomingMoments', () => {
    it('should return an array (currently always empty — stub)', async () => {
      const result = await service.getUpcomingMoments(buildContext(), 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should accept a limit parameter without throwing', async () => {
      await expect(service.getUpcomingMoments(buildContext(), 5)).resolves.toEqual([]);
    });
  });

  describe('getMomentHistory', () => {
    it('should return an array (currently always empty — stub)', async () => {
      const result = await service.getMomentHistory(buildContext(), 20);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should accept a limit parameter without throwing', async () => {
      await expect(service.getMomentHistory(buildContext(), 20)).resolves.toEqual([]);
    });
  });

  describe('getScheduledCallbacks', () => {
    it('should return an array (currently always empty — stub)', async () => {
      const result = await service.getScheduledCallbacks(buildContext());

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should accept a limit parameter without throwing', async () => {
      await expect(service.getScheduledCallbacks(buildContext(), 5)).resolves.toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should not throw for an unusual limit parameter (stub does not validate)', async () => {
      await expect(service.getUpcomingMoments(buildContext(), -1)).resolves.toEqual([]);
    });

    it('should not throw for a missing user context (stub does not validate)', async () => {
      const context = buildContext({ userId: '' });

      await expect(service.getUpcomingMoments(context, 10)).resolves.toEqual([]);
    });
  });
});
