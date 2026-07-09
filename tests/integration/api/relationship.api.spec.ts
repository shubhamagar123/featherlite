/**
 * Relationship API Integration Tests
 * Verifies relationship and dimensions endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient } from '@prisma/client';

describe('Relationship API Endpoints', () => {
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

  describe('GET /api/v1/companions/:companionId/relationship', () => {
    it('should return current relationship status', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('companionId');
      expect(res.body.data).toHaveProperty('status');
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include relationship metrics', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const relationship = res.body.data;
      expect(relationship).toHaveProperty('affinity');
      expect(relationship).toHaveProperty('trust');
      expect(relationship).toHaveProperty('intimacy');
      expect(relationship).toHaveProperty('passion');
    });

    it('should return metrics as numbers between 0 and 100', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const rel = res.body.data;
      const metrics = [rel.affinity, rel.trust, rel.intimacy, rel.passion];
      metrics.forEach(metric => {
        expect(typeof metric).toBe('number');
        expect(metric).toBeGreaterThanOrEqual(0);
        expect(metric).toBeLessThanOrEqual(100);
      });
    });

    it('should include interaction history', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const relationship = res.body.data;
      expect(relationship).toHaveProperty('lastInteraction');
      expect(relationship).toHaveProperty('interactionCount');
      expect(typeof relationship.interactionCount).toBe('number');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /api/v1/companions/:companionId/relationship/timeline', () => {
    it('should return relationship timeline', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/timeline')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('timeline');
      expect(Array.isArray(res.body.data.timeline)).toBe(true);
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include timeline events with timestamps', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/timeline')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.timeline.length > 0) {
        const event = res.body.data.timeline[0];
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('impact');
      }
    });

    it('should sort timeline in reverse chronological order', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/timeline')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const timeline = res.body.data.timeline;
      for (let i = 1; i < timeline.length; i++) {
        const prevTime = new Date(timeline[i - 1].timestamp).getTime();
        const currTime = new Date(timeline[i].timestamp).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('should support date range filtering', async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/timeline')
        .query({ startDate, endDate })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data).toHaveProperty('timeline');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/timeline')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/timeline')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/companions/:companionId/relationship/dimensions', () => {
    it('should return relationship dimensions', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/dimensions')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('dimensions');
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include all relationship dimensions', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/dimensions')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const dimensions = res.body.data.dimensions;
      expect(dimensions).toHaveProperty('affinity');
      expect(dimensions).toHaveProperty('trust');
      expect(dimensions).toHaveProperty('intimacy');
      expect(dimensions).toHaveProperty('passion');
    });

    it('should include detailed dimension information', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/dimensions')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const affinity = res.body.data.dimensions.affinity;
      expect(affinity).toHaveProperty('score');
      expect(affinity).toHaveProperty('description');
      expect(affinity).toHaveProperty('factors');
      expect(Array.isArray(affinity.factors)).toBe(true);
    });

    it('should return dimension scores between 0 and 100', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/dimensions')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const dims = res.body.data.dimensions;
      Object.values(dims).forEach(dim => {
        expect(typeof (dim as any).score).toBe('number');
        expect((dim as any).score).toBeGreaterThanOrEqual(0);
        expect((dim as any).score).toBeLessThanOrEqual(100);
      });
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/dimensions')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/dimensions')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/companions/:companionId/relationship/memories', () => {
    it('should return shared memories', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('memories');
      expect(Array.isArray(res.body.data.memories)).toBe(true);
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include memory details', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.memories.length > 0) {
        const memory = res.body.data.memories[0];
        expect(memory).toHaveProperty('id');
        expect(memory).toHaveProperty('content');
        expect(memory).toHaveProperty('createdAt');
        expect(memory).toHaveProperty('significance');
      }
    });

    it('should sort memories by significance', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const memories = res.body.data.memories;
      if (memories.length > 1) {
        for (let i = 1; i < memories.length; i++) {
          const prevSig = memories[i - 1].significance || 0;
          const currSig = memories[i].significance || 0;
          expect(prevSig).toBeGreaterThanOrEqual(currSig);
        }
      }
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/memories')
        .query({ skip: 0, take: 10 })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('skip');
      expect(res.body.data).toHaveProperty('take');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/memories')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Relationship API Error Handling', () => {
    it('should handle invalid companion ID', async () => {
      const res = await request(app)
        .get('/api/v1/companions/invalid-id/relationship')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      expect([200, 404, 400]).toContain(res.status);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test-companion-1/relationship')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });
  });
});
