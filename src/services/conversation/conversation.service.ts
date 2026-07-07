import { BaseService } from '../base/base.service';
import { IConversationService } from './conversation.service.interface';
import { IResult, Result } from '../types/result.type';
import { ConversationRepository } from '@database/repositories/conversation.repository';
import { ConversationDTO, CreateConversationDTO, UpdateConversationDTO } from '../dtos/conversation.dto';
import { ConversationMapper } from '../mappers/conversation.mapper';
import { InputValidator } from '../validators/input.validators';
import { NotFoundError } from '../exceptions';

export class ConversationService extends BaseService implements IConversationService {
  constructor(private readonly conversationRepository: ConversationRepository) {
    super();
  }

  async createConversation(dto: CreateConversationDTO): Promise<IResult<ConversationDTO>> {
    try {
      InputValidator.requireValidUUID(dto.userId, 'userId');
      InputValidator.requireValidUUID(dto.companionId, 'companionId');
      InputValidator.requireNotEmpty(dto.title, 'title');

      const conversation = await this.conversationRepository.create({
        userId: dto.userId,
        companionId: dto.companionId,
        title: dto.title,
        status: 'ACTIVE',
        messageCount: 0,
      } as any);

      this.logBusinessEvent('conversation_created', {
        conversationId: conversation.id,
        userId: dto.userId,
        companionId: dto.companionId,
      });

      return Result.success(ConversationMapper.toDTO(conversation));
    } catch (error) {
      this.logError(error as Error, 'Failed to create conversation');
      return Result.failure(new Error('Failed to create conversation'));
    }
  }

  async getConversationById(conversationId: string): Promise<IResult<ConversationDTO>> {
    try {
      InputValidator.requireValidUUID(conversationId, 'conversationId');
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation) return Result.failure(new NotFoundError('Conversation', conversationId));
      return Result.success(ConversationMapper.toDTO(conversation));
    } catch (error) {
      this.logError(error as Error, 'Failed to get conversation');
      return Result.failure(new Error('Failed to get conversation'));
    }
  }

  async getConversationsByUserId(userId: string, limit: number = 50): Promise<IResult<ConversationDTO[]>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requirePositive(limit, 'limit');
      const conversations = await this.conversationRepository.findByUserId(userId, { take: limit });
      return Result.success(ConversationMapper.toDTOArray(conversations));
    } catch (error) {
      this.logError(error as Error, 'Failed to get conversations');
      return Result.failure(new Error('Failed to get conversations'));
    }
  }

  async getActiveConversation(userId: string, companionId: string): Promise<IResult<ConversationDTO>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requireValidUUID(companionId, 'companionId');
      const conversation = await this.conversationRepository.findActiveByUserIdAndCompanionId(userId, companionId);
      if (!conversation) {
        return Result.failure(
          new NotFoundError('Active Conversation', `userId: ${userId}, companionId: ${companionId}`)
        );
      }
      return Result.success(ConversationMapper.toDTO(conversation));
    } catch (error) {
      this.logError(error as Error, 'Failed to get active conversation');
      return Result.failure(new Error('Failed to get active conversation'));
    }
  }

  async updateConversation(
    conversationId: string,
    dto: UpdateConversationDTO
  ): Promise<IResult<ConversationDTO>> {
    try {
      InputValidator.requireValidUUID(conversationId, 'conversationId');
      if (dto.title) InputValidator.requireNotEmpty(dto.title, 'title');

      const conversation = await this.conversationRepository.update(conversationId, {
        title: dto.title,
      });

      this.logBusinessEvent('conversation_updated', { conversationId });

      return Result.success(ConversationMapper.toDTO(conversation));
    } catch (error) {
      this.logError(error as Error, 'Failed to update conversation');
      return Result.failure(new Error('Failed to update conversation'));
    }
  }

  async archiveConversation(conversationId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(conversationId, 'conversationId');
      await this.conversationRepository.update(conversationId, { status: 'ARCHIVED' });
      this.logBusinessEvent('conversation_archived', { conversationId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to archive conversation');
      return Result.failure(new Error('Failed to archive conversation'));
    }
  }

  async reopenConversation(conversationId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(conversationId, 'conversationId');
      await this.conversationRepository.update(conversationId, { status: 'ACTIVE' });
      this.logBusinessEvent('conversation_reopened', { conversationId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to reopen conversation');
      return Result.failure(new Error('Failed to reopen conversation'));
    }
  }

  async incrementMessageCount(conversationId: string, count: number = 1): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(conversationId, 'conversationId');
      InputValidator.requirePositive(count, 'count');
      await this.conversationRepository.incrementMessageCount(conversationId, count);
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to increment message count');
      return Result.failure(new Error('Failed to increment message count'));
    }
  }
}
