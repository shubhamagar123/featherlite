/**
 * Interaction API Integration Tests
 * Verifies interaction and conversation endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('Interaction API Endpoints', () => {
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

  describe('POST /api/v1/interactions/start', () => {
    it('should start new interaction', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello companion!',
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('conversationId');
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('response');
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should return conversation with proper structure', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello companion!',
        })
        .expect(200);

      const data = res.body.data;
      expect(typeof data.conversationId).toBe('string');
      expect(data.message).toHaveProperty('content');
      expect(data.message).toHaveProperty('role');
      expect(data.response).toHaveProperty('content');
      expect(data.response).toHaveProperty('role');
    });

    it('should include metadata in response', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello companion!',
        })
        .expect(200);

      const data = res.body.data;
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello!',
        })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          // Missing message
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should require companionId', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          message: 'Hello!',
          // Missing companionId
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello!',
        })
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('POST /api/v1/conversations/:conversationId/continue', () => {
    it('should continue existing conversation', async () => {
      const startRes = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello!',
        })
        .expect(200);

      const conversationId = startRes.body.data.conversationId;

      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/continue`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          message: 'How are you?',
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('conversationId', conversationId);
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('response');
    });

    it('should preserve conversation history', async () => {
      const startRes = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'First message',
        })
        .expect(200);

      const conversationId = startRes.body.data.conversationId;

      await request(app)
        .post(`/api/v1/conversations/${conversationId}/continue`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          message: 'Second message',
        })
        .expect(200);

      const historyRes = await request(app)
        .get(`/api/v1/conversations/${conversationId}/history`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(historyRes.body.data.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should require authentication', async () => {
      const conversationId = uuidv4();
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/continue`)
        .send({
          message: 'Hello!',
        })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent conversation', async () => {
      const conversationId = uuidv4();
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/continue`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          message: 'Hello!',
        });

      expect([404, 400]).toContain(res.status);
    });

    it('should validate message content', async () => {
      const startRes = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello!',
        })
        .expect(200);

      const conversationId = startRes.body.data.conversationId;

      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/continue`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          // Missing message
        });

      expect([400, 422]).toContain(res.status);
    });
  });

  describe('GET /api/v1/conversations/:conversationId/history', () => {
    it('should return conversation history', async () => {
      const startRes = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello!',
        })
        .expect(200);

      const conversationId = startRes.body.data.conversationId;

      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}/history`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('conversationId');
      expect(res.body.data).toHaveProperty('messages');
      expect(Array.isArray(res.body.data.messages)).toBe(true);
    });

    it('should include message metadata', async () => {
      const startRes = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello!',
        })
        .expect(200);

      const conversationId = startRes.body.data.conversationId;

      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}/history`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.messages.length > 0) {
        const message = res.body.data.messages[0];
        expect(message).toHaveProperty('content');
        expect(message).toHaveProperty('role');
        expect(message).toHaveProperty('createdAt');
      }
    });

    it('should preserve message order', async () => {
      const startRes = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'First message',
        })
        .expect(200);

      const conversationId = startRes.body.data.conversationId;

      await request(app)
        .post(`/api/v1/conversations/${conversationId}/continue`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          message: 'Second message',
        })
        .expect(200);

      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}/history`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const messages = res.body.data.messages;
      for (let i = 1; i < messages.length; i++) {
        const prevTime = new Date(messages[i - 1].createdAt).getTime();
        const currTime = new Date(messages[i].createdAt).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    it('should require authentication', async () => {
      const conversationId = uuidv4();
      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}/history`)
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent conversation', async () => {
      const conversationId = uuidv4();
      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}/history`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      expect([404, 400]).toContain(res.status);
    });

    it('should include requestId and timestamp', async () => {
      const startRes = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          companionId: 'test-companion-1',
          message: 'Hello!',
        })
        .expect(200);

      const conversationId = startRes.body.data.conversationId;

      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}/history`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('Interaction API Error Handling', () => {
    it('should return 404 for invalid conversation ID format', async () => {
      const res = await request(app)
        .get('/api/v1/conversations/invalid-id/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      expect([400, 404]).toContain(res.status);
    });

    it('should handle missing companionId in start', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .send({
          message: 'Hello!',
        });

      expect([400, 422]).toContain(res.status);
    });
  });
});
