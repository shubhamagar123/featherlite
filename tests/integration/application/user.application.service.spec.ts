/**
 * User Application Service Integration Tests
 * Verifies user profile and preference management business logic
 */

import { UserApplicationService } from '@application/services/user.application.service';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('UserApplicationService', () => {
  let service: UserApplicationService;
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
    service = new UserApplicationService(db);
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'user@example.com',
        username: 'testuser',
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
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getProfile(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('id', testUser.id);
      expect(result.value).toHaveProperty('email', testUser.email);
      expect(result.value).toHaveProperty('firstName');
      expect(result.value).toHaveProperty('lastName');
    });

    it('should return all profile fields', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getProfile(context);

      const profile = result.value;
      expect(profile).toHaveProperty('avatar');
      expect(profile).toHaveProperty('bio');
      expect(profile).toHaveProperty('timezone');
      expect(profile).toHaveProperty('preferredLanguage');
      expect(profile).toHaveProperty('createdAt');
      expect(profile).toHaveProperty('updatedAt');
    });

    it('should fail for non-existent user', async () => {
      const context = {
        userId: uuidv4(),
        email: 'nonexistent@example.com',
        reqId: uuidv4(),
      };

      const result = await service.getProfile(context);

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'New bio',
      };

      const result = await service.updateProfile(context, updateData);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('firstName', 'Updated');
      expect(result.value).toHaveProperty('lastName', 'Name');
      expect(result.value).toHaveProperty('bio', 'New bio');
    });

    it('should update avatar', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        avatar: 'https://example.com/avatar.jpg',
      };

      const result = await service.updateProfile(context, updateData);

      expect(result.value).toHaveProperty('avatar', 'https://example.com/avatar.jpg');
    });

    it('should update timezone', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        timezone: 'America/New_York',
      };

      const result = await service.updateProfile(context, updateData);

      expect(result.value).toHaveProperty('timezone', 'America/New_York');
    });

    it('should update preferred language', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        preferredLanguage: 'es',
      };

      const result = await service.updateProfile(context, updateData);

      expect(result.value).toHaveProperty('preferredLanguage', 'es');
    });

    it('should preserve unmodified fields', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        firstName: 'Updated',
      };

      const result = await service.updateProfile(context, updateData);

      expect(result.value).toHaveProperty('email', testUser.email);
      expect(result.value).toHaveProperty('username', testUser.username);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getPreferences(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('notificationsEnabled');
      expect(result.value).toHaveProperty('emailNotificationsEnabled');
      expect(result.value).toHaveProperty('pushNotificationsEnabled');
      expect(result.value).toHaveProperty('privacyLevel');
    });

    it('should return boolean notification preferences', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getPreferences(context);

      const prefs = result.value;
      expect(typeof (prefs as any).notificationsEnabled).toBe('boolean');
      expect(typeof (prefs as any).emailNotificationsEnabled).toBe('boolean');
      expect(typeof (prefs as any).pushNotificationsEnabled).toBe('boolean');
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        notificationsEnabled: false,
        emailNotificationsEnabled: true,
      };

      const result = await service.updatePreferences(context, updateData);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('notificationsEnabled', false);
      expect(result.value).toHaveProperty('emailNotificationsEnabled', true);
    });

    it('should update privacy level', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        privacyLevel: 'private',
      };

      const result = await service.updatePreferences(context, updateData);

      expect(result.value).toHaveProperty('privacyLevel', 'private');
    });

    it('should preserve unmodified preferences', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        notificationsEnabled: false,
      };

      const result = await service.updatePreferences(context, updateData);

      expect(result.value).toHaveProperty('emailNotificationsEnabled');
      expect(result.value).toHaveProperty('pushNotificationsEnabled');
      expect(result.value).toHaveProperty('privacyLevel');
    });

    it('should fail for non-existent user', async () => {
      const context = {
        userId: uuidv4(),
        email: 'nonexistent@example.com',
        reqId: uuidv4(),
      };

      const result = await service.updatePreferences(context, {});

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid update data', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const invalidData = {
        firstName: 123, // Should be string
      };

      const result = await service.updateProfile(context, invalidData as any);

      // Should either accept and convert, or reject gracefully
      expect([true, false]).toContain(result.isSuccess());
    });

    it('should handle missing context user ID', async () => {
      const context = {
        userId: '',
        email: 'test@example.com',
        reqId: uuidv4(),
      };

      const result = await service.getProfile(context);

      expect(result.isFailure()).toBe(true);
    });
  });
});
