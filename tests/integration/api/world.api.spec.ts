/**
 * World API Integration Tests
 * Verifies world and scene endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient } from '@prisma/client';

describe('World API Endpoints', () => {
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

  describe('GET /api/v1/world', () => {
    it('should return current world state', async () => {
      const res = await request(app)
        .get('/api/v1/world')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('state');
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include world context and atmosphere', async () => {
      const res = await request(app)
        .get('/api/v1/world')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const world = res.body.data;
      expect(world.state).toHaveProperty('context');
      expect(world.state).toHaveProperty('atmosphere');
      expect(world.state).toHaveProperty('time');
    });

    it('should include weather and environment data', async () => {
      const res = await request(app)
        .get('/api/v1/world')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const world = res.body.data;
      expect(world.state).toHaveProperty('weather');
      expect(world.state).toHaveProperty('environment');
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/world')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/world')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should respond quickly', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/api/v1/world')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });
  });

  describe('POST /api/v1/world/refresh', () => {
    it('should refresh world state', async () => {
      const res = await request(app)
        .post('/api/v1/world/refresh')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('state');
      expect(res.body).toHaveProperty('requestId');
    });

    it('should return updated world state', async () => {
      const res = await request(app)
        .post('/api/v1/world/refresh')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const world = res.body.data;
      expect(world.state).toHaveProperty('context');
      expect(world.state).toHaveProperty('atmosphere');
      expect(world.state).toHaveProperty('updatedAt');
    });

    it('should update world timestamp', async () => {
      const refreshRes = await request(app)
        .post('/api/v1/world/refresh')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const updatedAt = new Date(refreshRes.body.data.state.updatedAt).getTime();
      const now = Date.now();

      expect(updatedAt).toBeGreaterThan(now - 5000); // Within 5 seconds
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/world/refresh')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .post('/api/v1/world/refresh')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/v1/world/scene', () => {
    it('should return current scene', async () => {
      const res = await request(app)
        .get('/api/v1/world/scene')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('description');
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include scene characteristics', async () => {
      const res = await request(app)
        .get('/api/v1/world/scene')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const scene = res.body.data;
      expect(scene).toHaveProperty('atmosphere');
      expect(scene).toHaveProperty('environment');
      expect(scene).toHaveProperty('characters');
      expect(scene).toHaveProperty('objects');
    });

    it('should include scene timing information', async () => {
      const res = await request(app)
        .get('/api/v1/world/scene')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const scene = res.body.data;
      expect(scene).toHaveProperty('timeOfDay');
      expect(scene).toHaveProperty('season');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/world/scene')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return proper Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/world/scene')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /api/v1/world/today', () => {
    it('should return today\'s world context', async () => {
      const res = await request(app)
        .get('/api/v1/world/today')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('date');
      expect(res.body.data).toHaveProperty('theme');
      expect(res.body.data).toHaveProperty('context');
      expect(res.body).toHaveProperty('requestId');
    });

    it('should include daily events and highlights', async () => {
      const res = await request(app)
        .get('/api/v1/world/today')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const today = res.body.data;
      expect(today).toHaveProperty('events');
      expect(today).toHaveProperty('highlights');
      expect(Array.isArray(today.events)).toBe(true);
      expect(Array.isArray(today.highlights)).toBe(true);
    });

    it('should return today\'s date in response', async () => {
      const res = await request(app)
        .get('/api/v1/world/today')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const responseDate = new Date(res.body.data.date);
      const today = new Date();

      expect(responseDate.toDateString()).toBe(today.toDateString());
    });

    it('should include weather forecast', async () => {
      const res = await request(app)
        .get('/api/v1/world/today')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      const today = res.body.data;
      expect(today).toHaveProperty('weather');
      expect(today.weather).toHaveProperty('condition');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/world/today')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should include timestamp in response', async () => {
      const res = await request(app)
        .get('/api/v1/world/today')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', 'test-user-1')
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('World API Error Handling', () => {
    it('should return 404 for invalid endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/world/invalid')
        .set('Authorization', 'Bearer valid-firebase-token')
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/world')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });
  });
});
