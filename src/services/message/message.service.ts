import { BaseService } from '../base/base.service';
import { IMessageService } from './message.service.interface';
import { IResult, Result } from '../types/result.type';
import { MessageRepository } from '@database/repositories/message.repository';
import { MessageDTO, CreateMessageDTO, PaginatedMessagesDTO } from '../dtos/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import { InputValidator } from '../validators/input.validators';
import { NotFoundError } from '../exceptions';

export class MessageService extends BaseService implements IMessageService {
  constructor(private readonly messageRepository: MessageRepository) {
    super();
  }

  async createMessage(dto: CreateMessageDTO): Promise<IResult<MessageDTO>> {
    try {
      InputValidator.requireValidUUID(dto.conversationId, 'conversationId');
      InputValidator.requireValidUUID(dto.userId, 'userId');
      InputValidator.requireValidUUID(dto.companionId, 'companionId');
      InputValidator.requireNotEmpty(dto.content, 'content');
      InputValidator.requireInEnum(dto.role, ['USER', 'COMPANION'], 'role');

      const message = await this.messageRepository.create({
        conversationId: dto.conversationId,
        userId: dto.userId,
        companionId: dto.companionId,
        content: dto.content,
        role: dto.role as any,
        status: 'SENT',
      } as any);

      this.logBusinessEvent('message_created', {
        messageId: message.id,
        conversationId: dto.conversationId,
        role: dto.role,
      });

      return Result.success(MessageMapper.toDTO(message));
    } catch (error) {
      this.logError(error as Error, 'Failed to create message');
      return Result.failure(new Error('Failed to create message'));
    }
  }

  async getMessageById(messageId: string): Promise<IResult<MessageDTO>> {
    try {
      InputValidator.requireValidUUID(messageId, 'messageId');
      const message = await this.messageRepository.findById(messageId);
      if (!message) return Result.failure(new NotFoundError('Message', messageId));
      return Result.success(MessageMapper.toDTO(message));
    } catch (error) {
      this.logError(error as Error, 'Failed to get message');
      return Result.failure(new Error('Failed to get message'));
    }
  }

  async getConversationMessages(
    conversationId: string,
    skip: number = 0,
    take: number = 50
  ): Promise<IResult<PaginatedMessagesDTO>> {
    try {
      InputValidator.requireValidUUID(conversationId, 'conversationId');
      InputValidator.requireNonNegative(skip, 'skip');
      InputValidator.requirePositive(take, 'take');

      const messages = await this.messageRepository.findByConversationId(conversationId, { skip, take });
      const total = await this.messageRepository.countByConversationId(conversationId);

      const page = Math.floor(skip / take) + 1;
      const hasMore = skip + take < total;

      return Result.success({
        messages: MessageMapper.toDTOArray(messages),
        total,
        page,
        pageSize: take,
        hasMore,
      });
    } catch (error) {
      this.logError(error as Error, 'Failed to get conversation messages');
      return Result.failure(new Error('Failed to get conversation messages'));
    }
  }

  async markAsRead(messageId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(messageId, 'messageId');
      await this.messageRepository.update(messageId, { status: 'READ' });
      this.logBusinessEvent('message_marked_as_read', { messageId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to mark message as read');
      return Result.failure(new Error('Failed to mark message as read'));
    }
  }

  async markAsDelivered(messageId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(messageId, 'messageId');
      await this.messageRepository.update(messageId, { status: 'DELIVERED' });
      this.logBusinessEvent('message_marked_as_delivered', { messageId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to mark message as delivered');
      return Result.failure(new Error('Failed to mark message as delivered'));
    }
  }

  async softDeleteMessage(messageId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(messageId, 'messageId');
      await this.messageRepository.softDelete(messageId);
      this.logBusinessEvent('message_soft_deleted', { messageId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to soft delete message');
      return Result.failure(new Error('Failed to soft delete message'));
    }
  }

  async getUnreadCount(conversationId: string): Promise<IResult<number>> {
    try {
      InputValidator.requireValidUUID(conversationId, 'conversationId');
      const count = await this.messageRepository.countByConversationId(conversationId);
      return Result.success(count);
    } catch (error) {
      this.logError(error as Error, 'Failed to get unread count');
      return Result.failure(new Error('Failed to get unread count'));
    }
  }
}
