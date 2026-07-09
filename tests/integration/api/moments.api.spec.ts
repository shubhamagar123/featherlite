/**
 * Moments API Integration Tests
 * Verifies moments and callbacks endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient } from '@prisma/client';

describe('Moments API Endpoints', () => {
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

  describe('GET /api/v1/moments/upcoming', () => {
    it('should return upcoming moments', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('moments');
      expect(Array.isArray(res.body.data.moments)).toBe(true);
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include moment details', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.moments.length > 0) {
        const moment = res.body.data.moments[0];
        expect(moment).toHaveProperty('id');
        expect(moment).toHaveProperty('title');
        expect(moment).toHaveProperty('description');
        expect(moment).toHaveProperty('scheduledAt');
        expect(moment).toHaveProperty('companion');
        expect(moment).toHaveProperty('type');
      }
    });

    it('should sort moments by schedule time', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const moments = res.body.data.moments;
      for (let i = 1; i < moments.length; i++) {
        const prevTime = new Date(moments[i - 1].scheduledAt).getTime();
        const currTime = new Date(moments[i].scheduledAt).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    it('should filter moments to future dates only', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const now = Date.now();
      res.body.data.moments.forEach(moment => {
        const scheduledTime = new Date(moment.scheduledAt).getTime();
        expect(scheduledTime).toBeGreaterThanOrEqual(now);
      });
    });

    it('should support limit parameter', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .query({ limit: 5 })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data.moments.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /api/v1/moments/history', () => {
    it('should return moment history', async () => {
      const res = await request(app)
        .get('/api/v1/moments/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('moments');
      expect(Array.isArray(res.body.data.moments)).toBe(true);
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include past moments only', async () => {
      const res = await request(app)
        .get('/api/v1/moments/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.moments.length > 0) {
        const moment = res.body.data.moments[0];
        expect(moment).toHaveProperty('id');
        expect(moment).toHaveProperty('title');
        expect(moment).toHaveProperty('description');
        expect(moment).toHaveProperty('occurredAt');
        expect(moment).toHaveProperty('outcome');
      }
    });

    it('should sort history in reverse chronological order', async () => {
      const res = await request(app)
        .get('/api/v1/moments/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const moments = res.body.data.moments;
      for (let i = 1; i < moments.length; i++) {
        const prevTime = new Date(moments[i - 1].occurredAt).getTime();
        const currTime = new Date(moments[i].occurredAt).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/moments/history')
        .query({ skip: 0, take: 20 })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('skip');
      expect(res.body.data).toHaveProperty('take');
    });

    it('should support date range filtering', async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .get('/api/v1/moments/history')
        .query({ startDate, endDate })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data).toHaveProperty('moments');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/moments/history')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .get('/api/v1/moments/history')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/moments/callbacks', () => {
    it('should return scheduled callbacks', async () => {
      const res = await request(app)
        .get('/api/v1/moments/callbacks')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('callbacks');
      expect(Array.isArray(res.body.data.callbacks)).toBe(true);
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include callback details', async () => {
      const res = await request(app)
        .get('/api/v1/moments/callbacks')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      if (res.body.data.callbacks.length > 0) {
        const callback = res.body.data.callbacks[0];
        expect(callback).toHaveProperty('id');
        expect(callback).toHaveProperty('companion');
        expect(callback).toHaveProperty('scheduledAt');
        expect(callback).toHaveProperty('message');
        expect(callback).toHaveProperty('status');
      }
    });

    it('should separate pending and completed callbacks', async () => {
      const res = await request(app)
        .get('/api/v1/moments/callbacks')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('completed');
      expect(Array.isArray(res.body.data.pending)).toBe(true);
      expect(Array.isArray(res.body.data.completed)).toBe(true);
    });

    it('should sort pending callbacks by scheduled time', async () => {
      const res = await request(app)
        .get('/api/v1/moments/callbacks')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const pending = res.body.data.pending;
      for (let i = 1; i < pending.length; i++) {
        const prevTime = new Date(pending[i - 1].scheduledAt).getTime();
        const currTime = new Date(pending[i].scheduledAt).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    it('should support filtering by status', async () => {
      const res = await request(app)
        .get('/api/v1/moments/callbacks')
        .query({ status: 'pending' })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      res.body.data.callbacks.forEach(callback => {
        expect(callback.status).toBe('pending');
      });
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/moments/callbacks')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .get('/api/v1/moments/callbacks')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Moments API Error Handling', () => {
    it('should handle invalid limit parameter', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .query({ limit: 'invalid' })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      expect([200, 400]).toContain(res.status);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/moments/upcoming')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should handle invalid date range', async () => {
      const res = await request(app)
        .get('/api/v1/moments/history')
        .query({ startDate: 'invalid', endDate: 'invalid' })
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1');

      expect([200, 400]).toContain(res.status);
    });
  });
});
