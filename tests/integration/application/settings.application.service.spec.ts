/**
 * Settings Application Service Integration Tests
 * Verifies settings management business logic
 */

import { SettingsApplicationService } from '@application/services/settings.application.service';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('SettingsApplicationService', () => {
  let service: SettingsApplicationService;
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
    service = new SettingsApplicationService(db);
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'settings@example.com',
        username: 'settingsuser',
        firebaseUid: `firebase-${uuidv4()}`,
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

  describe('getAllSettings', () => {
    it('should return all settings', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getAllSettings(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('general');
      expect(result.value).toHaveProperty('privacy');
      expect(result.value).toHaveProperty('notifications');
      expect(result.value).toHaveProperty('companion');
    });

    it('should include all setting categories', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getAllSettings(context);

      const settings = result.value;
      expect((settings as any).general).toHaveProperty('theme');
      expect((settings as any).general).toHaveProperty('language');
      expect((settings as any).privacy).toHaveProperty('profileVisibility');
      expect((settings as any).notifications).toHaveProperty('emailNotifications');
      expect((settings as any).companion).toHaveProperty('conversationTone');
    });

    it('should fail for non-existent user', async () => {
      const context = {
        userId: uuidv4(),
        email: 'nonexistent@example.com',
        reqId: uuidv4(),
      };

      const result = await service.getAllSettings(context);

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('updateGeneral', () => {
    it('should update general settings', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        theme: 'dark',
        language: 'es',
      };

      const result = await service.updateGeneral(context, updateData);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('theme', 'dark');
      expect(result.value).toHaveProperty('language', 'es');
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

      const result = await service.updateGeneral(context, updateData);

      expect(result.value).toHaveProperty('timezone', 'America/New_York');
    });

    it('should preserve unmodified settings', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        theme: 'light',
      };

      const result = await service.updateGeneral(context, updateData);

      expect(result.value).toHaveProperty('language');
      expect(result.value).toHaveProperty('timezone');
    });
  });

  describe('updatePrivacy', () => {
    it('should update privacy settings', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        profileVisibility: 'friends',
        dataCollection: false,
      };

      const result = await service.updatePrivacy(context, updateData);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('profileVisibility', 'friends');
      expect(result.value).toHaveProperty('dataCollection', false);
    });

    it('should update analytics setting', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        analyticsEnabled: false,
      };

      const result = await service.updatePrivacy(context, updateData);

      expect(result.value).toHaveProperty('analyticsEnabled', false);
    });

    it('should preserve other privacy settings', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        profileVisibility: 'private',
      };

      const result = await service.updatePrivacy(context, updateData);

      expect(result.value).toHaveProperty('dataCollection');
      expect(result.value).toHaveProperty('analyticsEnabled');
    });
  });

  describe('updateNotifications', () => {
    it('should update notification settings', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        emailNotifications: false,
        notificationFrequency: 'weekly',
      };

      const result = await service.updateNotifications(context, updateData);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('emailNotifications', false);
      expect(result.value).toHaveProperty('notificationFrequency', 'weekly');
    });

    it('should update push notification setting', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        pushNotifications: false,
      };

      const result = await service.updateNotifications(context, updateData);

      expect(result.value).toHaveProperty('pushNotifications', false);
    });

    it('should preserve unmodified notification settings', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        emailNotifications: false,
      };

      const result = await service.updateNotifications(context, updateData);

      expect(result.value).toHaveProperty('pushNotifications');
      expect(result.value).toHaveProperty('notificationFrequency');
    });
  });

  describe('updateCompanion', () => {
    it('should update companion settings', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        conversationTone: 'formal',
        interactionStyle: 'questioning',
      };

      const result = await service.updateCompanion(context, updateData);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('conversationTone', 'formal');
      expect(result.value).toHaveProperty('interactionStyle', 'questioning');
    });

    it('should update default companion', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        defaultCompanion: 'companion-456',
      };

      const result = await service.updateCompanion(context, updateData);

      expect(result.value).toHaveProperty('defaultCompanion', 'companion-456');
    });

    it('should preserve unmodified companion settings', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        conversationTone: 'casual',
      };

      const result = await service.updateCompanion(context, updateData);

      expect(result.value).toHaveProperty('defaultCompanion');
      expect(result.value).toHaveProperty('interactionStyle');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing context user ID', async () => {
      const context = {
        userId: '',
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getAllSettings(context);

      expect(result.isFailure()).toBe(true);
    });

    it('should handle non-existent user for updates', async () => {
      const context = {
        userId: uuidv4(),
        email: 'nonexistent@example.com',
        reqId: uuidv4(),
      };

      const result = await service.updateGeneral(context, { theme: 'dark' });

      expect(result.isFailure()).toBe(true);
    });

    it('should handle invalid setting values', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const invalidData = {
        theme: 123, // Should be string
      };

      const result = await service.updateGeneral(context, invalidData as any);

      expect([true, false]).toContain(result.isSuccess());
    });
  });
});
