import { Conversation } from '@prisma/client';
import { ConversationDTO, ConversationDetailDTO, ConversationMetadataDTO } from '../dtos/conversation.dto';

export class ConversationMapper {
  static toDTO(conversation: Conversation): ConversationDTO {
    return {
      id: conversation.id,
      userId: conversation.userId,
      companionId: conversation.companionId,
      title: conversation.title || undefined,
      status: conversation.status,
      messageCount: conversation.messageCount,
      lastMessageAt: conversation.lastMessageAt || undefined,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  static toDetailDTO(conversation: Conversation): ConversationDetailDTO {
    return {
      ...this.toDTO(conversation),
      context: conversation.context || undefined,
    };
  }

  static toMetadataDTO(conversation: Conversation): ConversationMetadataDTO {
    return {
      id: conversation.id,
      title: conversation.title || undefined,
      messageCount: conversation.messageCount,
      lastMessageAt: conversation.lastMessageAt || undefined,
    };
  }

  static toDTOArray(conversations: Conversation[]): ConversationDTO[] {
    return conversations.map((c) => this.toDTO(c));
  }
}
