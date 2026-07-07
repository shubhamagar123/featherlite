import { Companion } from '@prisma/client';
import { CompanionDTO, CompanionDetailDTO, CompanionMetadataDTO } from '../dtos/companion.dto';

export class CompanionMapper {
  static toDTO(companion: Companion): CompanionDTO {
    return {
      id: companion.id,
      userId: companion.userId,
      name: companion.name,
      description: companion.description || undefined,
      avatar: companion.avatar || undefined,
      status: companion.status,
      version: companion.version,
      aiModel: companion.aiModel,
      totalConversations: companion.totalConversations,
      totalMessages: companion.totalMessages,
      affectionLevel: companion.affectionLevel,
      engagementScore: companion.engagementScore,
      createdAt: companion.createdAt,
      updatedAt: companion.updatedAt,
      lastInteractionAt: companion.lastInteractionAt || undefined,
    };
  }

  static toDetailDTO(companion: Companion): CompanionDetailDTO {
    return {
      ...this.toDTO(companion),
      personality: companion.personality || undefined,
      background: companion.background || undefined,
      systemPrompt: companion.systemPrompt || undefined,
    };
  }

  static toMetadataDTO(companion: Companion): CompanionMetadataDTO {
    return {
      id: companion.id,
      name: companion.name,
      avatar: companion.avatar || undefined,
      affectionLevel: companion.affectionLevel,
      engagementScore: companion.engagementScore,
      lastInteractionAt: companion.lastInteractionAt || undefined,
    };
  }

  static toDTOArray(companions: Companion[]): CompanionDTO[] {
    return companions.map((c) => this.toDTO(c));
  }
}
