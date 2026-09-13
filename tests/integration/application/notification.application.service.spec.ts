/**
 * Notification Application Service Integration Tests
 * Verifies notification and preference management business logic
 */

import { NotificationApplicationService } from '@application/services/notification.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('NotificationApplicationService', () => {
  let service: NotificationApplicationService;
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
    service = new NotificationApplicationService();
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: `notification-${uuidv4()}@example.com`,
        username: `notificationuser-${uuidv4().slice(0, 8)}`,
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
      const result = await service.getPreferences(buildContext());

      expect(result).toHaveProperty('notificationsEnabled');
      expect(result).toHaveProperty('emailNotificationsEnabled');
      expect(result).toHaveProperty('pushNotificationsEnabled');
    });

    it('should return channel and quiet-hours structure', async () => {
      const result = await service.getPreferences(buildContext());

      expect(result).toHaveProperty('channels');
      expect(result).toHaveProperty('quietHours');
      expect((result as any).channels).toHaveProperty('email');
      expect((result as any).channels).toHaveProperty('push');
      expect((result as any).channels).toHaveProperty('inApp');
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
      });

      expect(result).toHaveProperty('notificationsEnabled', false);
    });

    it('should update channel preferences', async () => {
      const result = await service.updatePreferences(buildContext(), {
        emailNotificationsEnabled: false,
        pushNotificationsEnabled: true,
      });

      expect((result as any).channels.email).toBe(false);
      expect((result as any).channels.push).toBe(true);
    });

    it('should preserve unmodified preferences', async () => {
      const result = await service.updatePreferences(buildContext(), {
        notificationsEnabled: false,
      });

      expect(result).toHaveProperty('channels');
      expect(result).toHaveProperty('quietHours');
    });

    it('should fail for non-existent user', async () => {
      const context = buildContext({ userId: uuidv4() });

      await expect(service.updatePreferences(context, {})).rejects.toThrow();
    });
  });

  describe('getHistory', () => {
    it('should return notification history as an array', async () => {
      const result = await service.getHistory(buildContext(), 20);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should respect the limit argument', async () => {
      const result = await service.getHistory(buildContext(), 1);

      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should sort notifications in reverse chronological order', async () => {
      await db.notification.create({
        data: {
          id: uuidv4(),
          userId: testUser.id,
          title: 'First',
          message: 'First message',
          type: 'SYSTEM',
          channel: 'IN_APP',
          createdAt: new Date(Date.now() - 60_000),
        },
      });
      await db.notification.create({
        data: {
          id: uuidv4(),
          userId: testUser.id,
          title: 'Second',
          message: 'Second message',
          type: 'SYSTEM',
          channel: 'IN_APP',
        },
      });

      const result = await service.getHistory(buildContext(), 20);

      for (let i = 1; i < result.length; i++) {
        const prevTime = new Date(result[i - 1].createdAt).getTime();
        const currTime = new Date(result[i].createdAt).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });
  });

  describe('registerPushToken', () => {
    it('should register a push notification token', async () => {
      const result = await service.registerPushToken(buildContext(), 'push-token-123', 'ios');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('platform', 'ios');
      expect(result).toHaveProperty('registeredAt');
    });

    it('should support multiple platforms', async () => {
      const iosResult = await service.registerPushToken(buildContext(), 'ios-token', 'ios');
      const androidResult = await service.registerPushToken(buildContext(), 'android-token', 'android');

      expect(iosResult.success).toBe(true);
      expect(androidResult.success).toBe(true);
    });

    it('should default the platform to web when not provided', async () => {
      const result = await service.registerPushToken(buildContext(), 'a-token');

      expect(result).toHaveProperty('platform', 'web');
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
          type: 'SYSTEM',
          channel: 'IN_APP',
          status: 'SENT',
        },
      });
      notificationId = notification.id;
    });

    it('should mark notification as read', async () => {
      const result = await service.markAsRead(buildContext(), notificationId);

      expect(result).toHaveProperty('isRead', true);
    });

    it('should return 404 for non-existent notification', async () => {
      await expect(service.markAsRead(buildContext(), uuidv4())).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing context user ID', async () => {
      const context = buildContext({ userId: '' });

      await expect(service.getPreferences(context)).rejects.toThrow();
    });
  });
});
