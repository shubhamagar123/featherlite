/**
 * Settings API Integration Tests
 * Verifies settings endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient } from '@prisma/client';

describe('Settings API Endpoints', () => {
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

  describe('GET /api/v1/settings', () => {
    it('should return all settings', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('general');
      expect(res.body.data).toHaveProperty('privacy');
      expect(res.body.data).toHaveProperty('notifications');
      expect(res.body.data).toHaveProperty('companion');
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include general settings', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const general = res.body.data.general;
      expect(general).toHaveProperty('theme');
      expect(general).toHaveProperty('language');
      expect(general).toHaveProperty('timezone');
    });

    it('should include privacy settings', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const privacy = res.body.data.privacy;
      expect(privacy).toHaveProperty('profileVisibility');
      expect(privacy).toHaveProperty('dataCollection');
      expect(privacy).toHaveProperty('analyticsEnabled');
    });

    it('should include notification settings', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const notifs = res.body.data.notifications;
      expect(notifs).toHaveProperty('emailNotifications');
      expect(notifs).toHaveProperty('pushNotifications');
      expect(notifs).toHaveProperty('notificationFrequency');
    });

    it('should include companion settings', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const companion = res.body.data.companion;
      expect(companion).toHaveProperty('defaultCompanion');
      expect(companion).toHaveProperty('conversationTone');
      expect(companion).toHaveProperty('interactionStyle');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('PATCH /api/v1/settings/general', () => {
    it('should update general settings', async () => {
      const updateData = {
        theme: 'dark',
        language: 'es',
      };

      const res = await request(app)
        .patch('/api/v1/settings/general')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.general.theme).toBe('dark');
      expect(res.body.data.general.language).toBe('es');
    });

    it('should update theme setting', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/general')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ theme: 'light' })
        .expect(200);

      expect(res.body.data.general.theme).toBe('light');
    });

    it('should update language setting', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/general')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ language: 'fr' })
        .expect(200);

      expect(res.body.data.general.language).toBe('fr');
    });

    it('should preserve other general settings', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/general')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ theme: 'dark' })
        .expect(200);

      expect(res.body.data.general).toHaveProperty('timezone');
      expect(res.body.data.general).toHaveProperty('language');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/general')
        .send({ theme: 'dark' })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/general')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ theme: 'dark' })
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('PATCH /api/v1/settings/privacy', () => {
    it('should update privacy settings', async () => {
      const updateData = {
        profileVisibility: 'friends',
        dataCollection: false,
      };

      const res = await request(app)
        .patch('/api/v1/settings/privacy')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.privacy.profileVisibility).toBe('friends');
      expect(res.body.data.privacy.dataCollection).toBe(false);
    });

    it('should update analytics setting', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/privacy')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ analyticsEnabled: false })
        .expect(200);

      expect(res.body.data.privacy.analyticsEnabled).toBe(false);
    });

    it('should preserve other privacy settings', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/privacy')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ profileVisibility: 'public' })
        .expect(200);

      expect(res.body.data.privacy).toHaveProperty('dataCollection');
      expect(res.body.data.privacy).toHaveProperty('analyticsEnabled');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/privacy')
        .send({ dataCollection: false })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/privacy')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ dataCollection: false })
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('PATCH /api/v1/settings/notifications', () => {
    it('should update notification settings', async () => {
      const updateData = {
        emailNotifications: false,
        notificationFrequency: 'weekly',
      };

      const res = await request(app)
        .patch('/api/v1/settings/notifications')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.notifications.emailNotifications).toBe(false);
      expect(res.body.data.notifications.notificationFrequency).toBe('weekly');
    });

    it('should update push notification setting', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/notifications')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ pushNotifications: false })
        .expect(200);

      expect(res.body.data.notifications.pushNotifications).toBe(false);
    });

    it('should preserve other notification settings', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/notifications')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ emailNotifications: false })
        .expect(200);

      expect(res.body.data.notifications).toHaveProperty('pushNotifications');
      expect(res.body.data.notifications).toHaveProperty('notificationFrequency');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/notifications')
        .send({ emailNotifications: false })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/notifications')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ emailNotifications: false })
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('PATCH /api/v1/settings/companion', () => {
    it('should update companion settings', async () => {
      const updateData = {
        conversationTone: 'formal',
        interactionStyle: 'questioning',
      };

      const res = await request(app)
        .patch('/api/v1/settings/companion')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.companion.conversationTone).toBe('formal');
      expect(res.body.data.companion.interactionStyle).toBe('questioning');
    });

    it('should update default companion', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/companion')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ defaultCompanion: 'companion-123' })
        .expect(200);

      expect(res.body.data.companion.defaultCompanion).toBe('companion-123');
    });

    it('should preserve other companion settings', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/companion')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ conversationTone: 'casual' })
        .expect(200);

      expect(res.body.data.companion).toHaveProperty('defaultCompanion');
      expect(res.body.data.companion).toHaveProperty('interactionStyle');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/companion')
        .send({ conversationTone: 'formal' })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/companion')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ conversationTone: 'casual' })
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Settings API Error Handling', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 404 for invalid settings endpoint', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/invalid')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({})
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should handle invalid request body', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/general')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          theme: 123, // Should be string
        });

      expect([200, 400]).toContain(res.status);
    });
  });
});
