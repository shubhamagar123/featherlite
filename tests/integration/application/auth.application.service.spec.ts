/**
 * Auth Application Service Integration Tests
 * Verifies authentication business logic with mocked external providers
 */

import { AuthApplicationService } from '@application/services/auth.application.service';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('AuthApplicationService', () => {
  let service: AuthApplicationService;
  let db: PrismaClient;
  let testUser: User;

  beforeAll(async () => {
    db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });
    service = new AuthApplicationService(db);
  });

  beforeEach(async () => {
    // Create test user
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'test@example.com',
        username: 'testuser',
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
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.createSession(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('sessionToken');
      expect(result.value).toHaveProperty('expiresAt');
      expect(result.value).toHaveProperty('user');
    });

    it('should return user data in session', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.createSession(context);

      const user = (result.value as any).user;
      expect(user.id).toBe(testUser.id);
      expect(user.email).toBe(testUser.email);
      expect(user.username).toBe(testUser.username);
    });

    it('should create valid token with future expiry', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.createSession(context);

      const token = (result.value as any).sessionToken;
      const expiresAt = new Date((result.value as any).expiresAt).getTime();
      const now = Date.now();

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(expiresAt).toBeGreaterThan(now);
    });

    it('should not return sensitive user data', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.createSession(context);

      const user = (result.value as any).user;
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('firebaseUid');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user profile', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentUser(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('id', testUser.id);
      expect(result.value).toHaveProperty('email', testUser.email);
      expect(result.value).toHaveProperty('username');
      expect(result.value).toHaveProperty('role');
    });

    it('should return complete user information', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentUser(context);

      const user = result.value;
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('avatar');
      expect(user).toHaveProperty('bio');
      expect(user).toHaveProperty('timezone');
    });

    it('should fail for non-existent user', async () => {
      const context = {
        userId: uuidv4(),
        email: 'nonexistent@example.com',
        reqId: uuidv4(),
      };

      const result = await service.getCurrentUser(context);

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.logout(context);

      expect(result.isSuccess()).toBe(true);
    });

    it('should return success message', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.logout(context);

      expect(result.value).toHaveProperty('message');
      expect(typeof (result.value as any).message).toBe('string');
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.refreshToken(context);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('sessionToken');
      expect(result.value).toHaveProperty('expiresAt');
    });

    it('should return new token different from previous', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result1 = await service.refreshToken(context);
      const token1 = (result1.value as any).sessionToken;

      const result2 = await service.refreshToken(context);
      const token2 = (result2.value as any).sessionToken;

      expect(token1).not.toBe(token2);
    });

    it('should return token with valid expiry', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.refreshToken(context);

      const expiresAt = new Date((result.value as any).expiresAt).getTime();
      const now = Date.now();

      expect(expiresAt).toBeGreaterThan(now);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', async () => {
      const context = {
        userId: uuidv4(),
        email: 'missing@example.com',
        reqId: uuidv4(),
      };

      const result = await service.getCurrentUser(context);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid context', async () => {
      const invalidContext = {
        userId: '',
        email: '',
        reqId: uuidv4(),
      };

      const result = await service.getCurrentUser(invalidContext);

      expect(result.isFailure()).toBe(true);
    });
  });
});
