import { Message } from '@prisma/client';
import { MessageDTO, MessageMetadataDTO } from '../dtos/message.dto';

export class MessageMapper {
  static toDTO(message: Message): MessageDTO {
    return {
      id: message.id,
      conversationId: message.conversationId,
      userId: message.userId,
      companionId: message.companionId,
      content: message.content,
      role: message.role,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: (message as any).updatedAt || message.createdAt,
    };
  }

  static toMetadataDTO(message: Message): MessageMetadataDTO {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
      status: message.status,
    };
  }

  static toDTOArray(messages: Message[]): MessageDTO[] {
    return messages.map((m) => this.toDTO(m));
  }
}
