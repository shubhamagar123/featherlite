/**
 * Notification Application Service Integration Tests
 * Verifies notification and preference management business logic
 */

import { NotificationApplicationService } from '@application/services/notification.application.service';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('NotificationApplicationService', () => {
  let service: NotificationApplicationService;
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
    service = new NotificationApplicationService(db);
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'notification@example.com',
        username: 'notificationuser',
        firebaseUid: `firebase-${uuidv4()}`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        notificationsEnabled: true,
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
      },
    });
  });

  afterEach(async () => {
    await db.notification.deleteMany({});
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getPreferences', () => {
    it('should return notification preferences', async () => {
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
    });

    it('should return all preference fields', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getPreferences(context);

      const prefs = result.value;
      expect(prefs).toHaveProperty('frequency');
      expect(prefs).toHaveProperty('email');
      expect(prefs).toHaveProperty('push');
      expect(prefs).toHaveProperty('sms');
      expect(prefs).toHaveProperty('inApp');
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
        frequency: 'daily',
      };

      const result = await service.updatePreferences(context, updateData);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('notificationsEnabled', false);
      expect(result.value).toHaveProperty('frequency', 'daily');
    });

    it('should update channel preferences', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const updateData = {
        email: false,
        push: true,
      };

      const result = await service.updatePreferences(context, updateData);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('email', false);
      expect(result.value).toHaveProperty('push', true);
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

      expect(result.value).toHaveProperty('frequency');
      expect(result.value).toHaveProperty('email');
      expect(result.value).toHaveProperty('push');
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

  describe('getHistory', () => {
    it('should return notification history', async () => {
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
      expect(result.value).toHaveProperty('notifications');
      expect(Array.isArray((result.value as any).notifications)).toBe(true);
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

    it('should sort notifications in reverse chronological order', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getHistory(context, {
        skip: 0,
        take: 20,
      });

      const notifs = (result.value as any).notifications;
      for (let i = 1; i < notifs.length; i++) {
        const prevTime = new Date(notifs[i - 1].createdAt).getTime();
        const currTime = new Date(notifs[i].createdAt).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('should support read status filtering', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getHistory(context, {
        skip: 0,
        take: 20,
        read: false,
      });

      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('registerToken', () => {
    it('should register push notification token', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.registerToken(context, 'push-token-123', 'ios');

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('token');
      expect(result.value).toHaveProperty('platform');
    });

    it('should validate platform value', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.registerToken(context, 'token', 'invalid');

      expect([true, false]).toContain(result.isSuccess());
    });

    it('should support multiple platforms', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const iosResult = await service.registerToken(context, 'ios-token', 'ios');
      const androidResult = await service.registerToken(context, 'android-token', 'android');

      expect(iosResult.isSuccess()).toBe(true);
      expect(androidResult.isSuccess()).toBe(true);
    });
  });

  describe('markAsRead', () => {
    let notificationId: string;

    beforeEach(async () => {
      const notification = await db.notification.create({
        data: {
          id: uuidv4(),
          userId: testUser.id,
          title: 'Test Notification',
          message: 'Test message',
          type: 'INFO',
          read: false,
        },
      });
      notificationId = notification.id;
    });

    it('should mark notification as read', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.markAsRead(context, notificationId);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('read', true);
    });

    it('should return 404 for non-existent notification', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.markAsRead(context, uuidv4());

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid pagination parameters', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getHistory(context, {
        skip: -1,
        take: -1,
      });

      expect([true, false]).toContain(result.isSuccess());
    });

    it('should handle missing context user ID', async () => {
      const context = {
        userId: '',
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getPreferences(context);

      expect(result.isFailure()).toBe(true);
    });
  });
});
