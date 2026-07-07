import { Moment } from '@prisma/client';
import { MomentDTO, MomentMetadataDTO } from '../dtos/moment.dto';

export class MomentMapper {
  static toDTO(moment: Moment): MomentDTO {
    return {
      id: moment.id,
      userId: moment.userId,
      companionId: moment.companionId,
      title: moment.title,
      description: moment.description || undefined,
      type: moment.type,
      category: moment.category,
      imageUrl: moment.imageUrl || undefined,
      significance: moment.significance,
      isPublic: moment.isPublic,
      tags: moment.tags || undefined,
      occurredAt: moment.occurredAt,
      createdAt: moment.createdAt,
      updatedAt: moment.updatedAt,
    };
  }

  static toMetadataDTO(moment: Moment): MomentMetadataDTO {
    return {
      id: moment.id,
      title: moment.title,
      type: moment.type,
      category: moment.category,
      significance: moment.significance,
      createdAt: moment.createdAt,
    };
  }

  static toDTOArray(moments: Moment[]): MomentDTO[] {
    return moments.map((m) => this.toDTO(m));
  }
}
