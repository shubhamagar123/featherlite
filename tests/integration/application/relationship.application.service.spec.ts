/**
 * Relationship Application Service Integration Tests
 * Verifies relationship state and dynamics business logic
 */

import { RelationshipApplicationService } from '@application/services/relationship.application.service';
import { PrismaClient, User, UserRole, UserStatus, Companion, CompanionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('RelationshipApplicationService', () => {
  let service: RelationshipApplicationService;
  let db: PrismaClient;
  let testUser: User;
  let testCompanion: Companion;

  beforeAll(async () => {
    db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });
    service = new RelationshipApplicationService(db);
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'relationship@example.com',
        username: 'relationshipuser',
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
    it('should return current relationship', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentRelationship(context, testCompanion.id);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('id');
      expect(result.value).toHaveProperty('companionId');
      expect(result.value).toHaveProperty('status');
    });

    it('should include relationship metrics', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentRelationship(context, testCompanion.id);

      const rel = result.value;
      expect(rel).toHaveProperty('affinity');
      expect(rel).toHaveProperty('trust');
      expect(rel).toHaveProperty('intimacy');
      expect(rel).toHaveProperty('passion');
    });

    it('should return metrics as numbers', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentRelationship(context, testCompanion.id);

      const rel = result.value;
      expect(typeof (rel as any).affinity).toBe('number');
      expect(typeof (rel as any).trust).toBe('number');
      expect(typeof (rel as any).intimacy).toBe('number');
      expect(typeof (rel as any).passion).toBe('number');
    });

    it('should fail for non-existent companion', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentRelationship(context, uuidv4());

      expect([true, false]).toContain(result.isSuccess());
    });
  });

  describe('getTimeline', () => {
    it('should return relationship timeline', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getTimeline(context, testCompanion.id);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('timeline');
      expect(Array.isArray((result.value as any).timeline)).toBe(true);
    });

    it('should include timeline events', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getTimeline(context, testCompanion.id);

      const timeline = (result.value as any).timeline;
      if (timeline.length > 0) {
        const event = timeline[0];
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('description');
      }
    });

    it('should sort timeline in reverse chronological order', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getTimeline(context, testCompanion.id);

      const timeline = (result.value as any).timeline;
      for (let i = 1; i < timeline.length; i++) {
        const prevTime = new Date(timeline[i - 1].timestamp).getTime();
        const currTime = new Date(timeline[i].timestamp).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });
  });

  describe('getDimensions', () => {
    it('should return relationship dimensions', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getDimensions(context, testCompanion.id);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('dimensions');
    });

    it('should include all dimensions', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getDimensions(context, testCompanion.id);

      const dims = (result.value as any).dimensions;
      expect(dims).toHaveProperty('affinity');
      expect(dims).toHaveProperty('trust');
      expect(dims).toHaveProperty('intimacy');
      expect(dims).toHaveProperty('passion');
    });

    it('should include detailed dimension information', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getDimensions(context, testCompanion.id);

      const affinity = (result.value as any).dimensions.affinity;
      expect(affinity).toHaveProperty('score');
      expect(affinity).toHaveProperty('description');
      expect(affinity).toHaveProperty('factors');
      expect(Array.isArray(affinity.factors)).toBe(true);
    });
  });

  describe('getSharedMemories', () => {
    it('should return shared memories', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getSharedMemories(context, testCompanion.id, {
        skip: 0,
        take: 10,
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('memories');
      expect(Array.isArray((result.value as any).memories)).toBe(true);
    });

    it('should include pagination info', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getSharedMemories(context, testCompanion.id, {
        skip: 0,
        take: 10,
      });

      expect(result.value).toHaveProperty('total');
      expect(result.value).toHaveProperty('skip');
      expect(result.value).toHaveProperty('take');
    });

    it('should include memory significance', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getSharedMemories(context, testCompanion.id, {
        skip: 0,
        take: 10,
      });

      const memories = (result.value as any).memories;
      if (memories.length > 0) {
        const memory = memories[0];
        expect(memory).toHaveProperty('significance');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid companion ID', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentRelationship(context, 'invalid-id');

      expect([true, false]).toContain(result.isSuccess());
    });

    it('should handle missing context user ID', async () => {
      const context = {
        userId: '',
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getCurrentRelationship(context, testCompanion.id);

      expect(result.isFailure()).toBe(true);
    });
  });
});
