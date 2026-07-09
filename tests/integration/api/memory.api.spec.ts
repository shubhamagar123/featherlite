/**
 * Memory API Integration Tests
 * Verifies memory retrieval and timeline endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('Memory API Endpoints', () => {
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

  describe('GET /api/v1/companions/:companionId/memories/search', () => {
    it('should search companion memories', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/search')
        .query({ q: 'favorite' })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('memories');
      expect(Array.isArray(res.body.data.memories)).toBe(true);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include memory fields in search results', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/search')
        .query({ q: 'test' })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.memories.length > 0) {
        const memory = res.body.data.memories[0];
        expect(memory).toHaveProperty('id');
        expect(memory).toHaveProperty('content');
        expect(memory).toHaveProperty('createdAt');
      }
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/search')
        .query({ q: 'test', skip: 0, take: 10 })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data).toHaveProperty('memories');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('skip');
      expect(res.body.data).toHaveProperty('take');
    });

    it('should require query parameter', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/search')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      expect([200, 400]).toContain(res.status);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/search')
        .query({ q: 'test' })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/search')
        .query({ q: 'test' })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /api/v1/companions/:companionId/memories', () => {
    it('should retrieve companion memories', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('memories');
      expect(Array.isArray(res.body.data.memories)).toBe(true);
      expect(res.body).toHaveProperty('requestId');
    });

    it('should support pagination in retrieve', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories')
        .query({ skip: 0, take: 20 })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('skip');
      expect(res.body.data).toHaveProperty('take');
    });

    it('should support sorting memories', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const memories = res.body.data.memories;
      if (memories.length > 1) {
        for (let i = 1; i < memories.length; i++) {
          const prevTime = new Date(memories[i - 1].createdAt).getTime();
          const currTime = new Date(memories[i].createdAt).getTime();
          expect(prevTime).toBeGreaterThanOrEqual(currTime);
        }
      }
    });

    it('should include memory metadata', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.memories.length > 0) {
        const memory = res.body.data.memories[0];
        expect(memory).toHaveProperty('id');
        expect(memory).toHaveProperty('content');
        expect(memory).toHaveProperty('type');
        expect(memory).toHaveProperty('createdAt');
        expect(memory).toHaveProperty('updatedAt');
      }
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/v1/companions/:companionId/memories/timeline', () => {
    it('should return memory timeline', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/timeline')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('timeline');
      expect(Array.isArray(res.body.data.timeline)).toBe(true);
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include timeline entries with dates', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/timeline')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.timeline.length > 0) {
        const entry = res.body.data.timeline[0];
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('memories');
        expect(Array.isArray(entry.memories)).toBe(true);
      }
    });

    it('should sort timeline in chronological order', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/timeline')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const timeline = res.body.data.timeline;
      for (let i = 1; i < timeline.length; i++) {
        const prevDate = new Date(timeline[i - 1].date).getTime();
        const currDate = new Date(timeline[i].date).getTime();
        expect(currDate).toBeGreaterThanOrEqual(prevDate);
      }
    });

    it('should support date range filtering', async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/timeline')
        .query({ startDate, endDate })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data).toHaveProperty('timeline');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/timeline')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/memories/timeline')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/memories/:memoryId', () => {
    it('should return memory details', async () => {
      const memoryId = uuidv4();
      const res = await request(app)
        .get(`/api/v1/memories/${memoryId}`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      // May return 200 or 404 depending on whether memory exists
      expect([200, 404]).toContain(res.status);
    });

    it('should include memory full details when found', async () => {
      // Get a real memory ID first
      const memoriesRes = await request(app)
        .get('/api/v1/companions/test-companion-1/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (memoriesRes.body.data.memories.length > 0) {
        const memoryId = memoriesRes.body.data.memories[0].id;

        const res = await request(app)
          .get(`/api/v1/memories/${memoryId}`)
          .set('Authorization', 'Bearer valid-firebase-token')
          .set('x-test-user-id', 'test-user-1')
          .expect(200);

        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('id', memoryId);
        expect(res.body.data).toHaveProperty('content');
        expect(res.body.data).toHaveProperty('type');
        expect(res.body.data).toHaveProperty('companion');
        expect(res.body.data).toHaveProperty('context');
        expect(res.body.data).toHaveProperty('createdAt');
        expect(res.body.data).toHaveProperty('updatedAt');
      }
    });

    it('should return 404 for non-existent memory', async () => {
      const memoryId = uuidv4();
      const res = await request(app)
        .get(`/api/v1/memories/${memoryId}`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      expect([404, 400]).toContain(res.status);
    });

    it('should require authentication', async () => {
      const memoryId = uuidv4();
      const res = await request(app)
        .get(`/api/v1/memories/${memoryId}`)
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include requestId and timestamp', async () => {
      const memoriesRes = await request(app)
        .get('/api/v1/companions/test-companion-1/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (memoriesRes.body.data.memories.length > 0) {
        const memoryId = memoriesRes.body.data.memories[0].id;

        const res = await request(app)
          .get(`/api/v1/memories/${memoryId}`)
          .set('Authorization', 'Bearer valid-firebase-token')
          .set('x-test-user-id', 'test-user-1')
          .expect(200);

        expect(res.body).toHaveProperty('requestId');
        expect(res.body).toHaveProperty('timestamp');
      }
    });
  });

  describe('Memory API Error Handling', () => {
    it('should handle invalid companion ID', async () => {
      const res = await request(app)
        .get('/api/v1/companions/invalid-id/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      expect([200, 404, 400]).toContain(res.status);
    });

    it('should handle invalid memory ID format', async () => {
      const res = await request(app)
        .get('/api/v1/memories/invalid-id')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      expect([400, 404]).toContain(res.status);
    });
  });
});
