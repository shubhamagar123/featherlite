/**
 * Interaction Application Service Integration Tests
 * Verifies conversation and interaction business logic
 */

import { InteractionApplicationService } from '@application/services/interaction.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { redisClientProvider } from '@infra/redis/redis-client.provider';
import { PrismaClient, User, UserRole, UserStatus, Companion, CompanionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('InteractionApplicationService', () => {
  let service: InteractionApplicationService;
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
    // The InteractionOrchestrator's session storage needs the Redis client
    // pool a real server bootstrap would initialize at startup.
    await redisClientProvider.initialize();
    service = new InteractionApplicationService();
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: `interaction-${uuidv4()}@example.com`,
        username: `interactionuser-${uuidv4().slice(0, 8)}`,
        firebaseUid: `firebase-${uuidv4()}`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    // The Context Engine's CompanionContextProvider resolves companion state
    // from a fixed, seeded CompanionRegistry (Kai/Kia), not from arbitrary DB
    // rows — so the FK'd Companion row must use one of those seeded IDs for
    // startInteraction/continueInteraction to succeed end-to-end.
    testCompanion = await db.companion.create({
      data: {
        id: 'companion-seed-kai',
        userId: testUser.id,
        name: 'Test Companion',
        description: 'A test companion',
        personality: 'friendly',
        status: CompanionStatus.ACTIVE,
      },
    });
  });

  afterEach(async () => {
    await db.conversation.deleteMany({});
    await db.companion.deleteMany({});
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
    await redisClientProvider.shutdown();
  });

  describe('startInteraction', () => {
    it('should start a new interaction and return a QueryResponseDto', async () => {
      const context = buildContext();

      const result = await service.startInteraction(context, testCompanion.id, 'Hello!');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('companionId', testCompanion.id);
      expect(result).toHaveProperty('input', 'Hello!');
      expect(result).toHaveProperty('response');
      expect(typeof result.duration).toBe('number');
    });

    it('should fail for non-existent companion', async () => {
      const context = buildContext();

      await expect(service.startInteraction(context, uuidv4(), 'Hello!')).rejects.toThrow();
    });
  });

  describe('continueInteraction', () => {
    let conversationId: string;

    beforeEach(async () => {
      const conversation = await db.conversation.create({
        data: {
          id: uuidv4(),
          userId: testUser.id,
          companionId: testCompanion.id,
          title: 'Test Conversation',
        },
      });
      conversationId = conversation.id;
    });

    it('should continue an existing conversation', async () => {
      const context = buildContext();

      const result = await service.continueInteraction(context, conversationId, 'How are you?');

      expect(result).toHaveProperty('companionId', testCompanion.id);
      expect(result).toHaveProperty('input', 'How are you?');
      expect(result).toHaveProperty('response');
    });

    it('should return the companion tied to the conversation', async () => {
      const context = buildContext();

      const result = await service.continueInteraction(context, conversationId, 'How are you?');

      expect(result.companionId).toBe(testCompanion.id);
    });

    it('should fail for a non-existent conversation', async () => {
      const context = buildContext();

      await expect(service.continueInteraction(context, uuidv4(), 'Hello!')).rejects.toThrow();
    });

    it("should fail for a conversation belonging to a different user", async () => {
      const otherUser = await db.user.create({
        data: {
          id: uuidv4(),
          email: `interaction-other-${uuidv4()}@example.com`,
          username: `interactionother-${uuidv4().slice(0, 8)}`,
          firebaseUid: `firebase-${uuidv4()}`,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
      });
      const context = buildContext({ userId: otherUser.id, userEmail: otherUser.email });

      await expect(service.continueInteraction(context, conversationId, 'Hello!')).rejects.toThrow();
    });
  });

  describe('getConversationHistory', () => {
    let conversationId: string;

    beforeEach(async () => {
      const conversation = await db.conversation.create({
        data: {
          id: uuidv4(),
          userId: testUser.id,
          companionId: testCompanion.id,
          title: 'Test Conversation',
        },
      });
      conversationId = conversation.id;
    });

    it('should return conversation history as an array', async () => {
      const context = buildContext();

      const result = await service.getConversationHistory(context, conversationId);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should preserve message order when messages exist', async () => {
      const context = buildContext();

      const result = await service.getConversationHistory(context, conversationId);

      for (let i = 1; i < result.length; i++) {
        const prevTime = new Date(result[i - 1].createdAt).getTime();
        const currTime = new Date(result[i].createdAt).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    it('should fail for a non-existent conversation', async () => {
      const context = buildContext();

      await expect(service.getConversationHistory(context, uuidv4())).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid context user ID', async () => {
      const context = buildContext({ userId: '' });

      await expect(service.startInteraction(context, testCompanion.id, 'Hello!')).rejects.toThrow();
    });
  });
});
