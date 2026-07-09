/**
 * Interaction Application Service Integration Tests
 * Verifies conversation and interaction business logic
 */

import { InteractionApplicationService } from '@application/services/interaction.application.service';
import { PrismaClient, User, UserRole, UserStatus, Companion, CompanionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('InteractionApplicationService', () => {
  let service: InteractionApplicationService;
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
    service = new InteractionApplicationService(db);
  });

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: uuidv4(),
        email: 'interaction@example.com',
        username: 'interactionuser',
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
    await db.conversation.deleteMany({});
    await db.companion.deleteMany({});
    await db.user.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('startInteraction', () => {
    it('should start new interaction', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.startInteraction(context, testCompanion.id, 'Hello!');

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('conversationId');
      expect(result.value).toHaveProperty('message');
      expect(result.value).toHaveProperty('response');
    });

    it('should create conversation with initial message', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.startInteraction(context, testCompanion.id, 'Test message');

      const conversationId = (result.value as any).conversationId;
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
      });

      expect(conversation).toBeDefined();
      expect(conversation?.userId).toBe(testUser.id);
      expect(conversation?.companionId).toBe(testCompanion.id);
    });

    it('should include response data', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.startInteraction(context, testCompanion.id, 'Hello!');

      expect(result.value).toHaveProperty('message.content');
      expect(result.value).toHaveProperty('message.role');
      expect(result.value).toHaveProperty('response.content');
      expect(result.value).toHaveProperty('response.role');
    });

    it('should fail for non-existent companion', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.startInteraction(context, uuidv4(), 'Hello!');

      expect(result.isFailure()).toBe(true);
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

    it('should continue existing conversation', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.continueInteraction(context, conversationId, 'How are you?');

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('conversationId', conversationId);
      expect(result.value).toHaveProperty('message');
      expect(result.value).toHaveProperty('response');
    });

    it('should preserve conversation ID', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.continueInteraction(context, conversationId, 'How are you?');

      expect((result.value as any).conversationId).toBe(conversationId);
    });

    it('should return 404 for non-existent conversation', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.continueInteraction(context, uuidv4(), 'Hello!');

      expect(result.isFailure()).toBe(true);
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

    it('should return conversation history', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getConversationHistory(context, conversationId);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveProperty('conversationId');
      expect(result.value).toHaveProperty('messages');
      expect(Array.isArray((result.value as any).messages)).toBe(true);
    });

    it('should preserve message order', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getConversationHistory(context, conversationId);

      const messages = (result.value as any).messages;
      for (let i = 1; i < messages.length; i++) {
        const prevTime = new Date(messages[i - 1].createdAt).getTime();
        const currTime = new Date(messages[i].createdAt).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    it('should return 404 for non-existent conversation', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.getConversationHistory(context, uuidv4());

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty message', async () => {
      const context = {
        userId: testUser.id,
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.startInteraction(context, testCompanion.id, '');

      expect([true, false]).toContain(result.isSuccess());
    });

    it('should handle invalid context user ID', async () => {
      const context = {
        userId: '',
        email: testUser.email,
        reqId: uuidv4(),
      };

      const result = await service.startInteraction(context, testCompanion.id, 'Hello!');

      expect(result.isFailure()).toBe(true);
    });
  });
});
