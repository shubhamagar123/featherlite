/**
 * Auth Application Service Integration Tests
 * Verifies authentication business logic with mocked external providers
 */

import { AuthApplicationService } from '@application/services/auth.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('AuthApplicationService', () => {
  let service: AuthApplicationService;
  let db: PrismaClient;
  let testUser: User;

  const buildContext = (overrides: Partial<ApplicationContext> = {}): ApplicationContext => ({
    userId: testUser.id,
    userEmail: testUser.email,
    userRoles: [],
    requestId: uuidv4(),
    traceId: uuidv4(),
    timestamp: new Date(),
    ...overrides,
  });

  beforeAll(async () => {
    db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });
    service = new AuthApplicationService();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: `auth-test-${uuidv4()}@example.com`,
        username: `authtestuser-${uuidv4().slice(0, 8)}`,
        firebaseUid: `firebase-${uuidv4()}`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('createSession', () => {
    it('should create session for authenticated user', async () => {
      const result = await service.createSession(buildContext());

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('tokenType');
    });

    it('should create valid token with future expiry', async () => {
      const result = await service.createSession(buildContext());

      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.length).toBeGreaterThan(0);
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('should include a refresh token', async () => {
      const result = await service.createSession(buildContext());

      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken!.length).toBeGreaterThan(0);
    });

    it('should fail for non-existent user', async () => {
      const context = buildContext({ userId: uuidv4() });

      await expect(service.createSession(context)).rejects.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user profile', async () => {
      const result = await service.getCurrentUser(buildContext());

      expect(result).toHaveProperty('id', testUser.id);
      expect(result).toHaveProperty('email', testUser.email);
      expect(result).toHaveProperty('uid');
      expect(result).toHaveProperty('roles');
    });

    it('should return roles from the context', async () => {
      const result = await service.getCurrentUser(buildContext({ userRoles: ['ADMIN'] }));

      expect(result.roles).toEqual(['ADMIN']);
      expect(result.customClaims).toEqual({ roles: ['ADMIN'] });
    });

    it('should fail for non-existent user', async () => {
      const context = buildContext({ userId: uuidv4() });

      await expect(service.getCurrentUser(context)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should successfully logout user without throwing', async () => {
      await expect(service.logout(buildContext())).resolves.toBeUndefined();
    });
  });

  describe('refreshToken', () => {
    // NOTE: the test environment's Redis client is a stub (see
    // src/infra/redis/redis.provider.ts — NODE_ENV === 'test' always returns
    // a no-op client), so a refresh token written by createSession() can
    // never be read back here. refreshToken() therefore always rejects in
    // this suite; these tests verify that current, environment-accurate
    // behavior rather than a real round-trip (which would require a live,
    // non-stubbed Redis).
    it('should reject when no refresh token is stored (stubbed Redis in test env)', async () => {
      const context = buildContext();
      const session = await service.createSession(context);

      await expect(service.refreshToken(context, session.refreshToken!)).rejects.toThrow();
    });

    it('should reject an invalid refresh token', async () => {
      const context = buildContext();
      await service.createSession(context);

      await expect(service.refreshToken(context, 'not-a-real-refresh-token')).rejects.toThrow();
    });

    it('createSession should produce a different access token on each call', async () => {
      const context = buildContext();

      const result1 = await service.createSession(context);
      await new Promise((resolve) => setTimeout(resolve, 5));
      const result2 = await service.createSession(context);

      expect(result1.accessToken).not.toBe(result2.accessToken);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', async () => {
      const context = buildContext({ userId: uuidv4(), userEmail: 'missing@example.com' });

      await expect(service.getCurrentUser(context)).rejects.toThrow();
    });

    it('should handle invalid context', async () => {
      const invalidContext = buildContext({ userId: '' });

      await expect(service.getCurrentUser(invalidContext)).rejects.toThrow();
    });
  });
});
