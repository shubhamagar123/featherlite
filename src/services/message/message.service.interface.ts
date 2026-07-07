import { IResult } from '../types/result.type';
import { MessageDTO, PaginatedMessagesDTO } from '../dtos/message.dto';
import { CreateMessageDTO } from '../dtos/message.dto';

export interface IMessageService {
  createMessage(dto: CreateMessageDTO): Promise<IResult<MessageDTO>>;
  getMessageById(messageId: string): Promise<IResult<MessageDTO>>;
  getConversationMessages(conversationId: string, skip?: number, take?: number): Promise<IResult<PaginatedMessagesDTO>>;
  markAsRead(messageId: string): Promise<IResult<void>>;
  markAsDelivered(messageId: string): Promise<IResult<void>>;
  softDeleteMessage(messageId: string): Promise<IResult<void>>;
  getUnreadCount(conversationId: string): Promise<IResult<number>>;
}
