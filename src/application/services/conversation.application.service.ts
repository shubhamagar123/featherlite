import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';
import { ForbiddenError, InternalServerError, NotFoundError } from '@utils/error';
import { ConversationRepository } from '@database/repositories/conversation.repository';
import { getConversationEngine } from '@engines/conversation';
import type { IConversationEngine, ConversationTurnResult } from '@engines/conversation';
import {
  getConversationEventBus,
  ConversationEventBus,
  ConversationLiveEvent,
} from '@services/realtime/conversation-event-bus.service';
import { v4 as uuidv4 } from 'uuid';

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
  private readonly conversationEngine: IConversationEngine;
  private readonly eventBus: ConversationEventBus;

  constructor() {
    super('ConversationApplicationService');
    this.conversationRepository = new ConversationRepository();
    this.conversationEngine = getConversationEngine();
    this.eventBus = getConversationEventBus();
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
