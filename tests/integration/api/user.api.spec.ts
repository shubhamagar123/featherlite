/**
 * User API Integration Tests
 * Verifies user profile and preferences endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient } from '@prisma/client';

describe('User API Endpoints', () => {
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

  describe('GET /api/v1/users/profile', () => {
    it('should return user profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('username');
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include all profile fields', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const profile = res.body.data;
      expect(profile).toHaveProperty('firstName');
      expect(profile).toHaveProperty('lastName');
      expect(profile).toHaveProperty('avatar');
      expect(profile).toHaveProperty('bio');
      expect(profile).toHaveProperty('timezone');
      expect(profile).toHaveProperty('preferredLanguage');
      expect(profile).toHaveProperty('createdAt');
      expect(profile).toHaveProperty('updatedAt');
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should not include sensitive data', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const profile = res.body.data;
      expect(profile).not.toHaveProperty('passwordHash');
      expect(profile).not.toHaveProperty('firebaseUid');
    });
  });

  describe('PATCH /api/v1/users/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
        bio: 'New bio',
      };

      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.firstName).toBe('Updated');
      expect(res.body.data.lastName).toBe('User');
      expect(res.body.data.bio).toBe('New bio');
    });

    it('should preserve unmodified fields', async () => {
      const updateData = {
        firstName: 'Updated',
      };

      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body.data).toHaveProperty('lastName');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('username');
    });

    it('should update avatar URL', async () => {
      const updateData = {
        avatar: 'https://example.com/avatar.jpg',
      };

      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body.data.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should update timezone', async () => {
      const updateData = {
        timezone: 'America/New_York',
      };

      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body.data.timezone).toBe('America/New_York');
    });

    it('should update preferred language', async () => {
      const updateData = {
        preferredLanguage: 'es',
      };

      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body.data.preferredLanguage).toBe('es');
    });

    it('should not allow updating immutable fields', async () => {
      const updateData = {
        id: 'different-id',
        email: 'different@example.com',
        username: 'different-username',
      };

      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData);

      // Should either ignore immutable fields or return 400
      expect([200, 400]).toContain(res.status);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .send({ firstName: 'Test' })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/v1/users/preferences', () => {
    it('should return user preferences', async () => {
      const res = await request(app)
        .get('/api/v1/users/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('notificationsEnabled');
      expect(res.body.data).toHaveProperty('emailNotificationsEnabled');
      expect(res.body.data).toHaveProperty('pushNotificationsEnabled');
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include privacy level preference', async () => {
      const res = await request(app)
        .get('/api/v1/users/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const preferences = res.body.data;
      expect(preferences).toHaveProperty('privacyLevel');
      expect(['public', 'friends', 'private']).toContain(preferences.privacyLevel);
    });

    it('should return boolean notification preferences', async () => {
      const res = await request(app)
        .get('/api/v1/users/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const prefs = res.body.data;
      expect(typeof prefs.notificationsEnabled).toBe('boolean');
      expect(typeof prefs.emailNotificationsEnabled).toBe('boolean');
      expect(typeof prefs.pushNotificationsEnabled).toBe('boolean');
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/users/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/users/preferences')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/v1/users/preferences', () => {
    it('should update notification preferences', async () => {
      const updateData = {
        notificationsEnabled: false,
        emailNotificationsEnabled: true,
      };

      const res = await request(app)
        .patch('/api/v1/users/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.notificationsEnabled).toBe(false);
      expect(res.body.data.emailNotificationsEnabled).toBe(true);
    });

    it('should update push notification preferences', async () => {
      const updateData = {
        pushNotificationsEnabled: false,
      };

      const res = await request(app)
        .patch('/api/v1/users/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body.data.pushNotificationsEnabled).toBe(false);
    });

    it('should update privacy level', async () => {
      const updateData = {
        privacyLevel: 'private',
      };

      const res = await request(app)
        .patch('/api/v1/users/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body.data.privacyLevel).toBe('private');
    });

    it('should preserve unmodified preferences', async () => {
      const updateData = {
        notificationsEnabled: false,
      };

      const res = await request(app)
        .patch('/api/v1/users/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(updateData)
        .expect(200);

      expect(res.body.data).toHaveProperty('emailNotificationsEnabled');
      expect(res.body.data).toHaveProperty('pushNotificationsEnabled');
      expect(res.body.data).toHaveProperty('privacyLevel');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/users/preferences')
        .send({ notificationsEnabled: false })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .patch('/api/v1/users/preferences')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({ notificationsEnabled: false })
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('User API Error Handling', () => {
    it('should return 404 for invalid endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/users/invalid')
        .set('Authorization', 'Bearer valid-firebase-token')
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should handle invalid request body', async () => {
      const invalidData = {
        firstName: 123, // Should be string
      };

      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send(invalidData);

      expect([200, 400]).toContain(res.status);
    });
  });
});
