import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from '@utils/error';
import { ConversationRepository } from '@database/repositories/conversation.repository';
import { CompanionRepository } from '@database/repositories/companion.repository';
import { getConversationEngine } from '@engines/conversation';
import type { IConversationEngine, ConversationTurnResult } from '@engines/conversation';
import {
  getConversationEventBus,
  ConversationEventBus,
  ConversationLiveEvent,
} from '@services/realtime/conversation-event-bus.service';
import { v4 as uuidv4 } from 'uuid';

export interface ConversationSummaryDto {
  id: string;
  companionId: string;
  status: string;
  createdAt: Date;
}

export interface ConversationMessageDto {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

/**
 * Conversation Application Service
 * Orchestrates sending a message (delegates to the Conversation Engine) and
 * subscribing to live conversation-state events (SSE).
 *
 * IMPORTANT: Never touches Prisma directly for the message-send path beyond
 * a single ownership lookup — the actual turn (context, prompt, LLM, memory
 * consent flow) is entirely the Conversation Engine's responsibility.
 */
export class ConversationApplicationService extends ApplicationServiceBase {
  private readonly conversationRepository: ConversationRepository;
  private readonly companionRepository: CompanionRepository;
  private readonly conversationEngine: IConversationEngine;
  private readonly eventBus: ConversationEventBus;

  constructor() {
    super('ConversationApplicationService');
    this.conversationRepository = new ConversationRepository();
    this.companionRepository = new CompanionRepository();
    this.conversationEngine = getConversationEngine();
    this.eventBus = getConversationEventBus();
  }

  /**
   * Starts a new conversation. If companionId is omitted, resolves the
   * user's own companion (findByUserId) rather than requiring the client
   * to already know an internal companion id.
   */
  async startConversation(
    context: ApplicationContext,
    companionId?: string
  ): Promise<ConversationSummaryDto> {
    this.logStart('startConversation', { userId: context.userId, companionId });

    const resolvedCompanionId = companionId ?? (await this.resolveDefaultCompanionId(context.userId));

    const conversation = await this.conversationRepository.create({
      user: { connect: { id: context.userId } },
      companion: { connect: { id: resolvedCompanionId } },
    } as any);

    this.logSuccess('startConversation', { userId: context.userId, conversationId: conversation.id });
    return {
      id: conversation.id,
      companionId: conversation.companionId,
      status: conversation.status,
      createdAt: conversation.createdAt,
    };
  }

  /** Paginated message history for the mid-conversation scrolled view. */
  async getMessages(
    context: ApplicationContext,
    conversationId: string,
    limit: number,
    offset: number
  ): Promise<{ messages: ConversationMessageDto[]; total: number }> {
    await this.assertConversationAccess(context.userId, conversationId);

    const withMessages = await this.conversationRepository.findWithMessagesAndPagination(
      conversationId,
      offset,
      limit
    );
    const messages = withMessages?.messages ?? [];
    const total = await this.conversationRepository
      .findWithMessagesAndPagination(conversationId, 0, Number.MAX_SAFE_INTEGER)
      .then((c) => c?.messages.length ?? 0);

    return {
      messages: messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      total,
    };
  }

  private async resolveDefaultCompanionId(userId: string): Promise<string> {
    const companions = await this.companionRepository.findByUserId(userId, { take: 1 });
    if (companions.length === 0) {
      throw new BadRequestError('No companion found for this user; specify companionId explicitly');
    }
    return companions[0].id;
  }

  async sendMessage(
    context: ApplicationContext,
    conversationId: string,
    message: string,
    messageId?: string
  ): Promise<ConversationTurnResult> {
    this.logStart('sendMessage', { userId: context.userId, conversationId });

    try {
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation');
      }
      if (conversation.userId !== context.userId) {
        throw new ForbiddenError('You do not have access to this conversation');
      }

      const result = await this.conversationEngine.sendMessage({
        userId: context.userId,
        companionId: conversation.companionId,
        sessionId: conversationId,
        messageId: messageId ?? uuidv4(),
        message,
      });

      if (!result.isSuccess || !result.value) {
        throw new InternalServerError(result.error?.message ?? 'Failed to process message');
      }

      this.logSuccess('sendMessage', { userId: context.userId, conversationId });
      return result.value;
    } catch (error) {
      this.logError('sendMessage', error, { userId: context.userId, conversationId });
      throw error;
    }
  }

  /**
   * Verify the requesting user owns the conversation before letting the
   * controller open an SSE stream for it.
   */
  async assertConversationAccess(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }
    if (conversation.userId !== userId) {
      throw new ForbiddenError('You do not have access to this conversation');
    }
  }

  /** Returns an unsubscribe function; caller is responsible for calling it on disconnect. */
  subscribeToLiveEvents(
    conversationId: string,
    listener: (event: ConversationLiveEvent) => void
  ): () => void {
    return this.eventBus.subscribe(conversationId, listener);
  }
}
