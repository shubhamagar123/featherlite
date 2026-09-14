/**
 * User Application Service Integration Tests
 * Verifies user profile and preference management business logic
 */

import { UserApplicationService } from '@application/services/user.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('UserApplicationService', () => {
  let service: UserApplicationService;
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
    service = new UserApplicationService();
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: `user-${uuidv4()}@example.com`,
        username: `testuser-${uuidv4().slice(0, 8)}`,
        firebaseUid: `firebase-${uuidv4()}`,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        timezone: 'UTC',
        preferredLanguage: 'en',
      },
    });
  });

  afterEach(async () => {
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const result = await service.getProfile(buildContext());

      expect(result).toHaveProperty('id', testUser.id);
      expect(result).toHaveProperty('email', testUser.email);
      expect(result).toHaveProperty('name', testUser.username);
    });

    it('should return all profile fields', async () => {
      const result = await service.getProfile(buildContext());

      expect(result).toHaveProperty('avatar');
      expect(result).toHaveProperty('bio');
      expect(result).toHaveProperty('emailVerified');
      expect(result).toHaveProperty('roles');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should fail for non-existent user', async () => {
      const context = buildContext({ userId: uuidv4() });

      await expect(service.getProfile(context)).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update the display name', async () => {
      const result = await service.updateProfile(buildContext(), { name: 'updated-username' });

      expect(result).toHaveProperty('name', 'updated-username');
    });

    it('should update bio', async () => {
      const result = await service.updateProfile(buildContext(), { bio: 'New bio' });

      expect(result).toHaveProperty('bio', 'New bio');
    });

    it('should update avatar', async () => {
      const result = await service.updateProfile(buildContext(), {
        avatar: 'https://example.com/avatar.jpg',
      });

      expect(result).toHaveProperty('avatar', 'https://example.com/avatar.jpg');
    });

    it('should preserve unmodified fields', async () => {
      const result = await service.updateProfile(buildContext(), { bio: 'Updated bio' });

      expect(result).toHaveProperty('email', testUser.email);
      expect(result).toHaveProperty('id', testUser.id);
    });

    it('should fail for non-existent user', async () => {
      const context = buildContext({ userId: uuidv4() });

      await expect(service.updateProfile(context, { bio: 'x' })).rejects.toThrow();
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const result = await service.getPreferences(buildContext());

      expect(result).toHaveProperty('notificationsEnabled');
      expect(result).toHaveProperty('emailNotificationsEnabled');
      expect(result).toHaveProperty('pushNotificationsEnabled');
      expect(result).toHaveProperty('privacyLevel');
    });

    it('should return boolean notification preferences', async () => {
      const result = await service.getPreferences(buildContext());

      expect(typeof (result as any).notificationsEnabled).toBe('boolean');
      expect(typeof (result as any).emailNotificationsEnabled).toBe('boolean');
      expect(typeof (result as any).pushNotificationsEnabled).toBe('boolean');
    });

    it('should fail for non-existent user', async () => {
      const context = buildContext({ userId: uuidv4() });

      await expect(service.getPreferences(context)).rejects.toThrow();
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const result = await service.updatePreferences(buildContext(), {
        notificationsEnabled: false,
        emailNotificationsEnabled: true,
      });

      expect(result).toHaveProperty('notificationsEnabled', false);
      expect(result).toHaveProperty('emailNotificationsEnabled', true);
    });

    it('should update privacy level', async () => {
      const result = await service.updatePreferences(buildContext(), { privacyLevel: 'private' });

      expect(result).toHaveProperty('privacyLevel', 'private');
    });

    it('should preserve unmodified preferences', async () => {
      const result = await service.updatePreferences(buildContext(), {
        notificationsEnabled: false,
      });

      expect(result).toHaveProperty('emailNotificationsEnabled');
      expect(result).toHaveProperty('pushNotificationsEnabled');
      expect(result).toHaveProperty('privacyLevel');
    });

    it('should fail for non-existent user', async () => {
      const context = buildContext({ userId: uuidv4() });

      await expect(service.updatePreferences(context, {})).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing context user ID', async () => {
      const context = buildContext({ userId: '' });

      await expect(service.getProfile(context)).rejects.toThrow();
    });
  });
});
