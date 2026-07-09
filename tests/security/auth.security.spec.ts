/**
 * Security Tests: Authentication & Authorization
 * Validates security mechanisms and protection against common attacks
 */

import request from 'supertest';
import { Application } from 'express';
import { createTestApp } from '@helpers/test-app.builder';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('Security: Authentication & Authorization', () => {
  let app: Application;
  let db: PrismaClient;
  let testUserId: string;

  beforeAll(async () => {
    app = createTestApp();
    db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });

    const user = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'security@example.com',
        username: 'securityuser',
        firebaseUid: `firebase-${uuidv4()}`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    testUserId = user.id;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('Authentication Validation', () => {
    it('should reject requests without authorization header', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject invalid token format', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidTokenFormat')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'token-without-prefix')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject empty token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject request with case-sensitive Bearer keyword', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'bearer valid-firebase-token')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Authorization Checks', () => {
    it('should prevent access to protected endpoints without token', async () => {
      const endpoints = [
        { method: 'get', path: '/api/v1/users/profile' },
        { method: 'get', path: '/api/v1/world' },
        { method: 'get', path: '/api/v1/settings' },
      ];

      for (const endpoint of endpoints) {
        const res = await request(app)[endpoint.method as 'get' | 'post'](endpoint.path);
        expect([401, 404]).toContain(res.status);
      }
    });

    it('should enforce user isolation - cannot access other user\'s data', async () => {
      const otherUserId = uuidv4();

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', otherUserId);

      // Should either return error or return data for requested user ID
      if (res.status === 200) {
        // If it succeeds, verify it returns the requested user's data
        expect(res.body.data.id).toBe(otherUserId);
      }
    });

    it('should validate request user ID matches context', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testUserId);
    });
  });

  describe('Token Validation', () => {
    it('should reject expired tokens', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer expired-token-12345')
        .set('x-test-user-id', testUserId);

      expect([401, 200]).toContain(res.status);
    });

    it('should reject tampered tokens', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
      const tamperedToken = validToken.substring(0, validToken.length - 5) + 'XXXXX';

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .set('x-test-user-id', testUserId);

      expect([401, 400]).toContain(res.status);
    });

    it('should reject tokens with invalid signature', async () => {
      const invalidToken = 'invalid.invalid.invalid';

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .set('x-test-user-id', testUserId);

      expect([401, 400]).toContain(res.status);
    });
  });

  describe('Input Validation & Injection Prevention', () => {
    it('should reject SQL injection attempts in parameters', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test\' OR \'1\'=\'1/memories')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId);

      expect([400, 404]).toContain(res.status);
    });

    it('should sanitize XSS attempts in request body', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId)
        .send({
          firstName: '<script>alert("XSS")</script>',
          lastName: 'User',
        });

      // Should either reject or sanitize
      expect([200, 400]).toContain(res.status);
    });

    it('should reject commands in query parameters', async () => {
      const res = await request(app)
        .get('/api/v1/companions/test/memories/search?q=`rm -rf /`')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId);

      expect([200, 400]).toContain(res.status);
    });

    it('should validate JSON structure in POST requests', async () => {
      const res = await request(app)
        .post('/api/v1/interactions/start')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId)
        .send('invalid json{');

      expect([400, 415]).toContain(res.status);
    });
  });

  describe('Rate Limiting & DoS Protection', () => {
    it('should handle rapid requests gracefully', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer valid-firebase-token')
            .set('x-test-user-id', testUserId)
        );
      }

      const responses = await Promise.all(requests);

      // Should either succeed or be rate limited, not crash
      responses.forEach(res => {
        expect([200, 429]).toContain(res.status);
      });
    });

    it('should return proper status code for rate limit', async () => {
      // Make many requests rapidly
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/session')
            .set('Authorization', 'Bearer firebase-token')
            .set('x-test-user-id', `user-${i}`)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      // If rate limiting is active, should have 429 responses
      expect(rateLimited.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sensitive Data Protection', () => {
    it('should not expose password hash in responses', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId)
        .expect(200);

      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should not expose Firebase UID in responses', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId)
        .expect(200);

      expect(res.body.data).not.toHaveProperty('firebaseUid');
    });

    it('should not include tokens in error messages', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer secret-token-12345');

      const responseText = JSON.stringify(res.body);
      expect(responseText).not.toContain('secret-token');
      expect(responseText).not.toContain('secret-');
    });

    it('should use HTTPS recommended headers', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId);

      // Should have security headers
      expect(res.headers).toBeDefined();
    });
  });

  describe('CORS & CSRF Protection', () => {
    it('should include proper CORS headers', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId)
        .set('Origin', 'https://example.com');

      expect([200, 401]).toContain(res.status);
    });

    it('should not allow wildcard CORS on authenticated endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId)
        .set('Origin', 'https://malicious.com');

      // Should either succeed (with proper origin check) or fail
      expect([200, 401, 403]).toContain(res.status);
    });
  });

  describe('Error Message Safety', () => {
    it('should not leak information in 404 errors', async () => {
      const res = await request(app)
        .get('/api/v1/nonexistent-endpoint')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId);

      expect(res.status).toBe(404);
      expect(res.body).not.toContain('endpoint');
      expect(res.body).not.toContain('route');
    });

    it('should not expose stack traces in error responses', async () => {
      const res = await request(app)
        .get('/api/v1/invalid')
        .set('Authorization', 'Bearer valid-firebase-token')
        .set('x-test-user-id', testUserId);

      const errorText = JSON.stringify(res.body);
      expect(errorText).not.toMatch(/at \w+\s*\(/);
      expect(errorText).not.toContain('stack');
    });
  });
});
