import { ApplicationServiceBase } from './application.service.base';
import {
  ApplicationContext,
  QueryResponseDto,
} from '../dtos/application.dtos';
import { ResourceNotFoundException } from '../exceptions/application.exceptions';
import { InteractionEngine } from '@engines/interaction/interaction.engine';
import { CompanionRepository } from '@database/repositories/companion.repository';
import { ConversationRepository } from '@database/repositories/conversation.repository';

/**
 * Interaction Application Service
 * Orchestrates conversation and interaction operations
 * IMPORTANT: Business logic layer
 */
export class InteractionApplicationService extends ApplicationServiceBase {
  private readonly interactionEngine: InteractionEngine;
  private readonly companionRepository: CompanionRepository;
  private readonly conversationRepository: ConversationRepository;

  constructor() {
    super('InteractionApplicationService');
    this.interactionEngine = new InteractionEngine();
    this.companionRepository = new CompanionRepository();
    this.conversationRepository = new ConversationRepository();
  }

  /**
   * Start new interaction
   * Use Case: Begin conversation with companion
   */
  async startInteraction(
    context: ApplicationContext,
    companionId: string,
    input: string
  ): Promise<QueryResponseDto> {
    this.logStart('startInteraction', { userId: context.userId, companionId });

    try {
      const companion = await this.companionRepository.findById(companionId);
      if (!companion) {
        throw new ResourceNotFoundException('Companion', companionId);
      }

      const interaction = await this.interactionEngine.handleInteraction(
        context.userId,
        companionId,
        input
      );

      this.logSuccess('startInteraction', { userId: context.userId, companionId });

      return {
        id: interaction.id,
        companionId,
        input,
        response: interaction.response || '',
        duration: interaction.duration || 0,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logError('startInteraction', error, { userId: context.userId, companionId });
      throw error;
    }
  }

  /**
   * Continue ongoing interaction
   * Use Case: Add to existing conversation
   */
  async continueInteraction(
    context: ApplicationContext,
    conversationId: string,
    input: string
  ): Promise<QueryResponseDto> {
    this.logStart('continueInteraction', { userId: context.userId, conversationId });

    try {
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation || conversation.userId !== context.userId) {
        throw new ResourceNotFoundException('Conversation', conversationId);
      }

      const interaction = await this.interactionEngine.continueInteraction(
        context.userId,
        conversationId,
        input
      );

      this.logSuccess('continueInteraction', { userId: context.userId, conversationId });

      return {
        id: interaction.id,
        companionId: conversation.companionId,
        input,
        response: interaction.response || '',
        duration: interaction.duration || 0,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logError('continueInteraction', error, { userId: context.userId, conversationId });
      throw error;
    }
  }

  /**
   * Get conversation history
   * Use Case: Fetch past interactions
   */
  async getConversationHistory(
    context: ApplicationContext,
    conversationId: string,
    limit: number = 50
  ): Promise<QueryResponseDto[]> {
    this.logStart('getConversationHistory', { userId: context.userId, conversationId });

    try {
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation || conversation.userId !== context.userId) {
        throw new ResourceNotFoundException('Conversation', conversationId);
      }

      const messages = await this.conversationRepository.findByConversationId(
        conversationId,
        { limit }
      );

      this.logSuccess('getConversationHistory', { userId: context.userId, conversationId });

      return messages.map((msg: any) => ({
        id: msg.id,
        companionId: conversation.companionId,
        input: msg.content || '',
        response: msg.content || '',
        duration: 0,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      this.logError('getConversationHistory', error, { userId: context.userId, conversationId });
      throw error;
    }
  }
}
