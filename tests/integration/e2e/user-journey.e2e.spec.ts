/**
 * End-to-End User Journey Tests
 * Validates complete user workflows through the entire system
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient, UserRole, UserStatus, CompanionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('E2E: Complete User Journey', () => {
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

  describe('New User Onboarding Journey', () => {
    let userId: string;
    let userToken: string;

    it('step 1: User creates session (authentication)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/session')
        .set('Authorization', 'Bearer firebase-token')
        .set('x-test-user-id', `user-${uuidv4()}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('sessionToken');
      expect(res.body.data).toHaveProperty('user');

      userId = res.body.data.user.id;
      userToken = res.body.data.sessionToken;
    });

    it('step 2: User retrieves their profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('id', userId);
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('username');
    });

    it('step 3: User updates their profile', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .send({
          firstName: 'Test',
          lastName: 'User',
          bio: 'Hello! I am a test user.',
          timezone: 'America/New_York',
        })
        .expect(200);

      expect(res.body.data.firstName).toBe('Test');
      expect(res.body.data.lastName).toBe('User');
      expect(res.body.data.timezone).toBe('America/New_York');
    });

    it('step 4: User sets notification preferences', async () => {
      const res = await request(app)
        .patch('/api/v1/users/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .send({
          notificationsEnabled: true,
          pushNotificationsEnabled: true,
          privacyLevel: 'friends',
        })
        .expect(200);

      expect(res.body.data.notificationsEnabled).toBe(true);
      expect(res.body.data.privacyLevel).toBe('friends');
    });

    it('step 5: User views initial world state', async () => {
      const res = await request(app)
        .get('/api/v1/world')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('state');
      expect(res.body.data.state).toHaveProperty('context');
      expect(res.body.data.state).toHaveProperty('atmosphere');
    });

    it('step 6: User registers for push notifications', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/tokens')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .send({
          token: 'device-push-token-123',
          platform: 'ios',
        })
        .expect(200);

      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('platform');
    });

    it('step 7: User checks their settings', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('general');
      expect(res.body.data).toHaveProperty('privacy');
      expect(res.body.data).toHaveProperty('notifications');
    });
  });

  describe('Companion Interaction Journey', () => {
    let userId: string;
    let companionId: string;
    let conversationId: string;
    let userToken = 'test-token';

    beforeAll(async () => {
      userId = uuidv4();
      companionId = uuidv4();

      // Setup test user and companion
      await db.user.create({
        data: {
          id: userId,
          email: `user-${uuidv4()}@example.com`,
          username: `user-${uuidv4()}`,
          firebaseUid: `firebase-${uuidv4()}`,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
      });

      await db.companion.create({
        data: {
          id: companionId,
          userId,
          name: 'Test Companion',
          description: 'A friendly companion',
          personality: 'cheerful',
          status: CompanionStatus.ACTIVE,
        },
      });
    });

    it('step 1: User starts interaction with companion', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .send({
          companionId,
          message: 'Hello! How are you today?',
        })
        .expect(200);

      expect(res.body.data).toHaveProperty('conversationId');
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('response');

      conversationId = res.body.data.conversationId;
    });

    it('step 2: User checks conversation history', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}/history`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('messages');
      expect(res.body.data.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('step 3: User continues conversation', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/continue`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .send({
          message: 'What are your thoughts on this?',
        })
        .expect(200);

      expect(res.body.data.conversationId).toBe(conversationId);
      expect(res.body.data).toHaveProperty('response');
    });

    it('step 4: User views companion memories', async () => {
      const res = await request(app)
        .get(`/api/v1/companions/${companionId}/memories`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('memories');
      expect(Array.isArray(res.body.data.memories)).toBe(true);
    });

    it('step 5: User checks relationship status', async () => {
      const res = await request(app)
        .get(`/api/v1/companions/${companionId}/relationship`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('affinity');
      expect(res.body.data).toHaveProperty('trust');
      expect(res.body.data).toHaveProperty('intimacy');
    });

    it('step 6: User views shared memories', async () => {
      const res = await request(app)
        .get(`/api/v1/companions/${companionId}/relationship/memories`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('memories');
      expect(Array.isArray(res.body.data.memories)).toBe(true);
    });

    it('step 7: User views relationship timeline', async () => {
      const res = await request(app)
        .get(`/api/v1/companions/${companionId}/relationship/timeline`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('timeline');
      expect(Array.isArray(res.body.data.timeline)).toBe(true);
    });
  });

  describe('Moments and Callbacks Journey', () => {
    let userId: string;
    let userToken = 'test-token';

    beforeAll(async () => {
      userId = uuidv4();
      await db.user.create({
        data: {
          id: userId,
          email: `user-${uuidv4()}@example.com`,
          username: `user-${uuidv4()}`,
          firebaseUid: `firebase-${uuidv4()}`,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
      });
    });

    it('step 1: User checks upcoming moments', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('moments');
      expect(Array.isArray(res.body.data.moments)).toBe(true);
    });

    it('step 2: User views past moments', async () => {
      const res = await request(app)
        .get('/api/v1/moments/history')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('moments');
      expect(Array.isArray(res.body.data.moments)).toBe(true);
    });

    it('step 3: User checks scheduled callbacks', async () => {
      const res = await request(app)
        .get('/api/v1/moments/callbacks')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('completed');
    });
  });

  describe('Daily Ritual Journey', () => {
    let userId: string;
    let userToken = 'test-token';

    beforeAll(async () => {
      userId = uuidv4();
      await db.user.create({
        data: {
          id: userId,
          email: `user-${uuidv4()}@example.com`,
          username: `user-${uuidv4()}`,
          firebaseUid: `firebase-${uuidv4()}`,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
      });
    });

    it('step 1: User checks notification history', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/history')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .query({ skip: 0, take: 20 })
        .expect(200);

      expect(res.body.data).toHaveProperty('notifications');
    });

    it('step 2: User checks today\'s world context', async () => {
      const res = await request(app)
        .get('/api/v1/world/today')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('date');
      expect(res.body.data).toHaveProperty('theme');
      expect(res.body.data).toHaveProperty('events');
    });

    it('step 3: User views current scene', async () => {
      const res = await request(app)
        .get('/api/v1/world/scene')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('description');
      expect(res.body.data).toHaveProperty('atmosphere');
    });

    it('step 4: User refreshes world state', async () => {
      const res = await request(app)
        .post('/api/v1/world/refresh')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(res.body.data).toHaveProperty('state');
      expect(res.body.data.state).toHaveProperty('updatedAt');
    });

    it('step 5: User updates settings', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/general')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-test-user-id', userId)
        .send({ theme: 'dark' })
        .expect(200);

      expect(res.body.data.general).toHaveProperty('theme', 'dark');
    });
  });

  describe('Full User Session Lifecycle', () => {
    it('should complete full session lifecycle: auth -> interact -> logout', async () => {
      let userId: string;
      let sessionToken: string;

      // 1. Create session
      const sessionRes = await request(app)
        .post('/api/v1/auth/session')
        .set('Authorization', 'Bearer firebase-token')
        .set('x-test-user-id', `lifecycle-${uuidv4()}`)
        .expect(200);

      sessionToken = sessionRes.body.data.sessionToken;
      userId = sessionRes.body.data.user.id;

      expect(sessionRes.body.data).toHaveProperty('sessionToken');

      // 2. Get current user
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${sessionToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(meRes.body.data.id).toBe(userId);

      // 3. Update profile
      const updateRes = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${sessionToken}`)
        .set('x-test-user-id', userId)
        .send({ firstName: 'Lifecycle', lastName: 'Test' })
        .expect(200);

      expect(updateRes.body.data.firstName).toBe('Lifecycle');

      // 4. Refresh token
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${sessionToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      const newToken = refreshRes.body.data.sessionToken;
      expect(newToken).toBeDefined();

      // 5. Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newToken}`)
        .set('x-test-user-id', userId)
        .expect(200);

      expect(logoutRes.body.success).toBe(true);
    });
  });
});
