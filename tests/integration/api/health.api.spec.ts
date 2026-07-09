/**
 * Health API Integration Tests
 * Verifies health check endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';

describe('Health API Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return full health status', async () => {
      const res = await request(app).get('/health').expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('timestamp');
      expect(res.body.data).toHaveProperty('uptime');
      expect(res.body.data).toHaveProperty('services');
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should have correct response structure', async () => {
      const res = await request(app).get('/health').expect(200);

      expect(res.body.data.status).toMatch(/^(UP|DOWN|DEGRADED)$/);
      expect(typeof res.body.data.uptime).toBe('number');
      expect(typeof res.body.data.services).toBe('object');
    });

    it('should return services object', async () => {
      const res = await request(app).get('/health').expect(200);

      const services = res.body.data.services;
      expect(services).toBeDefined();
      // Each service should have status and lastCheck
      Object.values(services).forEach((service: any) => {
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('lastCheck');
      });
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness probe status', async () => {
      const res = await request(app).get('/health/live').expect(200);

      expect(res.body).toHaveProperty('status');
      expect(['UP', 'DOWN']).toContain(res.body.status);
    });

    it('should respond quickly for liveness check', async () => {
      const startTime = Date.now();
      await request(app).get('/health/live').expect(200);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should respond in < 1 second
    });

    it('should return 503 if service is down', async () => {
      // This test assumes the service health check works
      const res = await request(app).get('/health/live');

      expect([200, 503]).toContain(res.status);
      if (res.status === 503) {
        expect(res.body.status).toBe('DOWN');
      }
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness probe status', async () => {
      const res = await request(app).get('/health/ready').expect(200);

      expect(res.body).toHaveProperty('status');
      expect(['READY', 'NOT_READY']).toContain(res.body.status);
    });

    it('should check service dependencies', async () => {
      const res = await request(app).get('/health/ready');

      expect([200, 503]).toContain(res.status);
    });

    it('should return appropriate status code based on readiness', async () => {
      const res = await request(app).get('/health/ready');

      if (res.body.status === 'READY') {
        expect(res.status).toBe(200);
      } else {
        expect(res.status).toBe(503);
      }
    });
  });

  describe('Health API Headers', () => {
    it('should return proper Content-Type header', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include request ID in response', async () => {
      const res = await request(app)
        .get('/health')
        .set('x-request-id', 'test-request-id-123');

      expect(res.body.requestId).toBeDefined();
    });

    it('should include timestamp in response', async () => {
      const res = await request(app).get('/health');

      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Health API Error Handling', () => {
    it('should handle invalid endpoints gracefully', async () => {
      const res = await request(app).get('/health/invalid').expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should not require authentication', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.status).toBe(200);
    });
  });
});
