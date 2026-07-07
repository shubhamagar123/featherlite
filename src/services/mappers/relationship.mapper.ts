import { Relationship } from '@prisma/client';
import { RelationshipDTO, RelationshipMetadataDTO } from '../dtos/relationship.dto';

export class RelationshipMapper {
  static toDTO(relationship: Relationship): RelationshipDTO {
    return {
      id: relationship.id,
      userId: relationship.userId,
      companionId: relationship.companionId,
      status: relationship.status,
      level: relationship.level,
      affectionScore: relationship.affectionScore,
      trustScore: relationship.trustScore,
      familiarityScore: relationship.familiarityScore,
      totalInteractions: relationship.totalInteractions,
      firstInteractionAt: relationship.firstInteractionAt || undefined,
      lastInteractionAt: relationship.lastInteractionAt || undefined,
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt,
    };
  }

  static toMetadataDTO(relationship: Relationship): RelationshipMetadataDTO {
    return {
      id: relationship.id,
      companionId: relationship.companionId,
      status: relationship.status,
      level: relationship.level,
      affectionScore: relationship.affectionScore,
      lastInteractionAt: relationship.lastInteractionAt || undefined,
    };
  }

  static toDTOArray(relationships: Relationship[]): RelationshipDTO[] {
    return relationships.map((r) => this.toDTO(r));
  }
}
