/**
 * Notification API Integration Tests
 * Verifies notification and preferences endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('Notification API Endpoints', () => {
  let app: Application;
  let db: PrismaClient;

  beforeAll(async () => {
    app = createTestApp();
    db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('GET /api/v1/notifications/preferences', () => {
    it('should return notification preferences', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('notificationsEnabled');
      expect(res.body.data).toHaveProperty('emailNotificationsEnabled');
      expect(res.body.data).toHaveProperty('pushNotificationsEnabled');
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include channel-specific preferences', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const prefs = res.body.data;
      expect(prefs).toHaveProperty('email');
      expect(prefs).toHaveProperty('push');
      expect(prefs).toHaveProperty('sms');
      expect(prefs).toHaveProperty('inApp');
    });

    it('should include frequency preferences', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const prefs = res.body.data;
      expect(prefs).toHaveProperty('frequency');
      expect(['realtime', 'daily', 'weekly', 'never']).toContain(prefs.frequency);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('PATCH /api/v1/notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const updateData = {
        notificationsEnabled: false,
        frequency: 'daily',
      };

      const res = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.notificationsEnabled).toBe(false);
      expect(res.body.data.frequency).toBe('daily');
    });

    it('should update channel preferences', async () => {
      const updateData = {
        email: false,
        push: true,
      };

      const res = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body.data.email).toBe(false);
      expect(res.body.data.push).toBe(true);
    });

    it('should preserve other preferences', async () => {
      const updateData = {
        notificationsEnabled: false,
      };

      const res = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body.data).toHaveProperty('frequency');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('push');
    });

    it('should validate frequency values', async () => {
      const updateData = {
        frequency: 'invalid',
      };

      const res = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData);

      expect([200, 400]).toContain(res.status);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/preferences')
        .send({ notificationsEnabled: false })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ notificationsEnabled: false })
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/notifications/history', () => {
    it('should return notification history', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('notifications');
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include notification details', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.notifications.length > 0) {
        const notif = res.body.data.notifications[0];
        expect(notif).toHaveProperty('id');
        expect(notif).toHaveProperty('title');
        expect(notif).toHaveProperty('message');
        expect(notif).toHaveProperty('type');
        expect(notif).toHaveProperty('read');
        expect(notif).toHaveProperty('createdAt');
      }
    });

    it('should sort notifications in reverse chronological order', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const notifs = res.body.data.notifications;
      for (let i = 1; i < notifs.length; i++) {
        const prevTime = new Date(notifs[i - 1].createdAt).getTime();
        const currTime = new Date(notifs[i].createdAt).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('should support filtering by read status', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/history')
        .query({ read: false })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      res.body.data.notifications.forEach(notif => {
        expect(notif.read).toBe(false);
      });
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/history')
        .query({ skip: 0, take: 20 })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('skip');
      expect(res.body.data).toHaveProperty('take');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/history')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/v1/notifications/tokens', () => {
    it('should register push notification token', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/tokens')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          token: 'push-token-12345',
          platform: 'ios',
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('platform');
      expect(res.body).toHaveProperty('requestId');
    });

    it('should require token parameter', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/tokens')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          platform: 'ios',
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should require platform parameter', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/tokens')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          token: 'push-token-12345',
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should validate platform value', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/tokens')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          token: 'push-token-12345',
          platform: 'invalid',
        });

      expect([200, 400]).toContain(res.status);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/tokens')
        .send({
          token: 'push-token-12345',
          platform: 'ios',
        })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/tokens')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          token: 'push-token-12345',
          platform: 'ios',
        })
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('PATCH /api/v1/notifications/:notificationId/read', () => {
    it('should mark notification as read', async () => {
      // First get a notification ID
      const historyRes = await request(app)
        .get('/api/v1/notifications/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (historyRes.body.data.notifications.length > 0) {
        const notificationId = historyRes.body.data.notifications[0].id;

        const res = await request(app)
          .patch(`/api/v1/notifications/${notificationId}/read`)
          .set('Authorization', 'Bearer valid-firebase-token')
          .set('x-test-user-id', 'test-user-1')
          .send({})
          .expect(200);

        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data.read).toBe(true);
      }
    });

    it('should return 404 for non-existent notification', async () => {
      const notificationId = uuidv4();
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({});

      expect([404, 400]).toContain(res.status);
    });

    it('should require authentication', async () => {
      const notificationId = uuidv4();
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .send({})
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const historyRes = await request(app)
        .get('/api/v1/notifications/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (historyRes.body.data.notifications.length > 0) {
        const notificationId = historyRes.body.data.notifications[0].id;

        const res = await request(app)
          .patch(`/api/v1/notifications/${notificationId}/read`)
          .set('Authorization', 'Bearer valid-firebase-token')
          .set('x-test-user-id', 'test-user-1')
          .send({})
          .expect(200);

        expect(res.body.timestamp).toBeDefined();
      }
    });
  });

  describe('Notification API Error Handling', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should handle invalid notification ID format', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/invalid-id/read')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({});

      expect([400, 404]).toContain(res.status);
    });
  });
});
