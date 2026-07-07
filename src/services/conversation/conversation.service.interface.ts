import { IResult } from '../types/result.type';
import { ConversationDTO } from '../dtos/conversation.dto';
import { CreateConversationDTO, UpdateConversationDTO } from '../dtos/conversation.dto';

export interface IConversationService {
  createConversation(dto: CreateConversationDTO): Promise<IResult<ConversationDTO>>;
  getConversationById(conversationId: string): Promise<IResult<ConversationDTO>>;
  getConversationsByUserId(userId: string, limit?: number): Promise<IResult<ConversationDTO[]>>;
  getActiveConversation(userId: string, companionId: string): Promise<IResult<ConversationDTO>>;
  updateConversation(conversationId: string, dto: UpdateConversationDTO): Promise<IResult<ConversationDTO>>;
  archiveConversation(conversationId: string): Promise<IResult<void>>;
  reopenConversation(conversationId: string): Promise<IResult<void>>;
  incrementMessageCount(conversationId: string, count?: number): Promise<IResult<void>>;
}
