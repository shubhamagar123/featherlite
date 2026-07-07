import { BaseService } from '../base/base.service';
import { IRelationshipService } from './relationship.service.interface';
import { IResult, Result } from '../types/result.type';
import { RelationshipRepository } from '@database/repositories/relationship.repository';
import { RelationshipDTO, CreateRelationshipDTO, UpdateRelationshipDTO } from '../dtos/relationship.dto';
import { RelationshipMapper } from '../mappers/relationship.mapper';
import { InputValidator } from '../validators/input.validators';
import { NotFoundError } from '../exceptions';

export class RelationshipService extends BaseService implements IRelationshipService {
  constructor(private readonly relationshipRepository: RelationshipRepository) {
    super();
  }

  async createRelationship(dto: CreateRelationshipDTO): Promise<IResult<RelationshipDTO>> {
    try {
      InputValidator.requireValidUUID(dto.userId, 'userId');
      InputValidator.requireValidUUID(dto.companionId, 'companionId');

      const relationship = await this.relationshipRepository.create({
        userId: dto.userId,
        companionId: dto.companionId,
        status: (dto.status || 'ACTIVE') as any,
        level: (dto.level || 'ACQUAINTANCE') as any,
        affectionScore: 0,
        trustScore: 0,
        familiarityScore: 0,
        totalInteractions: 0,
      } as any);

      this.logBusinessEvent('relationship_created', {
        relationshipId: relationship.id,
        userId: dto.userId,
        companionId: dto.companionId,
      });

      return Result.success(RelationshipMapper.toDTO(relationship));
    } catch (error) {
      this.logError(error as Error, 'Failed to create relationship');
      return Result.failure(new Error('Failed to create relationship'));
    }
  }

  async getRelationshipById(relationshipId: string): Promise<IResult<RelationshipDTO>> {
    try {
      InputValidator.requireValidUUID(relationshipId, 'relationshipId');
      const relationship = await this.relationshipRepository.findById(relationshipId);
      if (!relationship) return Result.failure(new NotFoundError('Relationship', relationshipId));
      return Result.success(RelationshipMapper.toDTO(relationship));
    } catch (error) {
      this.logError(error as Error, 'Failed to get relationship');
      return Result.failure(new Error('Failed to get relationship'));
    }
  }

  async getRelationshipByUserAndCompanion(userId: string, companionId: string): Promise<IResult<RelationshipDTO>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requireValidUUID(companionId, 'companionId');
      const relationship = await this.relationshipRepository.findByUserIdAndCompanionId(userId, companionId);
      if (!relationship) {
        return Result.failure(
          new NotFoundError('Relationship', `userId: ${userId}, companionId: ${companionId}`)
        );
      }
      return Result.success(RelationshipMapper.toDTO(relationship));
    } catch (error) {
      this.logError(error as Error, 'Failed to get relationship');
      return Result.failure(new Error('Failed to get relationship'));
    }
  }

  async getRelationshipsByUserId(userId: string, limit: number = 50): Promise<IResult<RelationshipDTO[]>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requirePositive(limit, 'limit');
      const relationships = await this.relationshipRepository.findByUserId(userId, { take: limit });
      return Result.success(RelationshipMapper.toDTOArray(relationships));
    } catch (error) {
      this.logError(error as Error, 'Failed to get relationships');
      return Result.failure(new Error('Failed to get relationships'));
    }
  }

  async updateRelationship(
    relationshipId: string,
    dto: UpdateRelationshipDTO
  ): Promise<IResult<RelationshipDTO>> {
    try {
      InputValidator.requireValidUUID(relationshipId, 'relationshipId');

      const relationship = await this.relationshipRepository.update(relationshipId, {
        status: dto.status as any,
        level: dto.level as any,
        affectionScore: dto.affectionScore,
        trustScore: dto.trustScore,
        familiarityScore: dto.familiarityScore,
      });

      this.logBusinessEvent('relationship_updated', { relationshipId });

      return Result.success(RelationshipMapper.toDTO(relationship));
    } catch (error) {
      this.logError(error as Error, 'Failed to update relationship');
      return Result.failure(new Error('Failed to update relationship'));
    }
  }

  async pauseRelationship(relationshipId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(relationshipId, 'relationshipId');
      await this.relationshipRepository.update(relationshipId, { status: 'PAUSED' });
      this.logBusinessEvent('relationship_paused', { relationshipId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to pause relationship');
      return Result.failure(new Error('Failed to pause relationship'));
    }
  }

  async resumeRelationship(relationshipId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(relationshipId, 'relationshipId');
      await this.relationshipRepository.update(relationshipId, { status: 'ACTIVE' });
      this.logBusinessEvent('relationship_resumed', { relationshipId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to resume relationship');
      return Result.failure(new Error('Failed to resume relationship'));
    }
  }

  async endRelationship(relationshipId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(relationshipId, 'relationshipId');
      await this.relationshipRepository.update(relationshipId, { status: 'ENDED' });
      this.logBusinessEvent('relationship_ended', { relationshipId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to end relationship');
      return Result.failure(new Error('Failed to end relationship'));
    }
  }

  async updateLastInteraction(relationshipId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(relationshipId, 'relationshipId');
      await this.relationshipRepository.updateLastInteraction(relationshipId);
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to update last interaction');
      return Result.failure(new Error('Failed to update last interaction'));
    }
  }
}
