/**
 * Relationship Application Service Integration Tests
 * Verifies relationship state and dynamics business logic
 *
 * NOTE: RelationshipResponseDto exposes only raw fields (id, companionId,
 * type, state, metadata, timestamps) — there is no computed closeness
 * level/tier. getRelationshipDimensions and getSharedMemories are currently
 * deliberate stubs (always-zero dimensions, always-empty memories).
 */

import { RelationshipApplicationService } from '@application/services/relationship.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { PrismaClient, User, UserRole, UserStatus, Companion, CompanionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('RelationshipApplicationService', () => {
  let service: RelationshipApplicationService;
  let db: PrismaClient;
  let testUser: User;
  let testCompanion: Companion;

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
    service = new RelationshipApplicationService();
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: `relationship-${uuidv4()}@example.com`,
        username: `relationshipuser-${uuidv4().slice(0, 8)}`,
        firebaseUid: `firebase-${uuidv4()}`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    testCompanion = await db.companion.create({
      data: {
        id: uuidv4(),
        userId: testUser.id,
        name: 'Test Companion',
        description: 'A test companion',
        personality: 'friendly',
        status: CompanionStatus.ACTIVE,
      },
    });
  });

  afterEach(async () => {
    await db.relationship.deleteMany({});
    await db.companion.deleteMany({});
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getCurrentRelationship', () => {
    it('should return the current relationship', async () => {
      const result = await service.getCurrentRelationship(buildContext(), testCompanion.id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('companionId', testCompanion.id);
      expect(result).toHaveProperty('state');
    });

    it('should default to a placeholder relationship when none exists yet', async () => {
      const result = await service.getCurrentRelationship(buildContext(), testCompanion.id);

      expect(result.state).toBe('active');
      expect(result.companionId).toBe(testCompanion.id);
    });

    it('should not expose a named closeness level/tier — only raw state and metadata', async () => {
      const result = await service.getCurrentRelationship(buildContext(), testCompanion.id);

      expect(typeof result.state).toBe('string');
      expect(result).not.toHaveProperty('level');
      expect(result).not.toHaveProperty('tier');
      expect(result).not.toHaveProperty('closeness');
    });

    it('should fail for non-existent companion', async () => {
      await expect(service.getCurrentRelationship(buildContext(), uuidv4())).rejects.toThrow();
    });
  });

  describe('getRelationshipTimeline', () => {
    it('should return the timeline as an array', async () => {
      const result = await service.getRelationshipTimeline(buildContext(), testCompanion.id);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should fail for non-existent companion', async () => {
      await expect(service.getRelationshipTimeline(buildContext(), uuidv4())).rejects.toThrow();
    });
  });

  describe('getRelationshipDimensions', () => {
    it('should return relationship dimensions (currently a zeroed stub)', async () => {
      const result = await service.getRelationshipDimensions(buildContext(), testCompanion.id);

      expect(result).toHaveProperty('trust', 0);
      expect(result).toHaveProperty('affection', 0);
      expect(result).toHaveProperty('familiarity', 0);
      expect(result).toHaveProperty('communication', 0);
      expect(result).toHaveProperty('intimacy', 0);
    });

    it('should fail for non-existent companion', async () => {
      await expect(service.getRelationshipDimensions(buildContext(), uuidv4())).rejects.toThrow();
    });
  });

  describe('getSharedMemories', () => {
    it('should return an array (currently always empty — stub)', async () => {
      const result = await service.getSharedMemories(buildContext(), testCompanion.id, 10);

      expect(result).toEqual([]);
    });

    it('should fail for non-existent companion', async () => {
      await expect(service.getSharedMemories(buildContext(), uuidv4(), 10)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid companion ID', async () => {
      await expect(service.getCurrentRelationship(buildContext(), 'invalid-id')).rejects.toThrow();
    });

    it('should handle missing context user ID', async () => {
      const context = buildContext({ userId: '' });

      // getCurrentRelationship only validates the companion, not the user id,
      // so this should still succeed — the placeholder relationship isn't
      // scoped to a specific user.
      await expect(service.getCurrentRelationship(context, testCompanion.id)).resolves.toBeDefined();
    });
  });
});
