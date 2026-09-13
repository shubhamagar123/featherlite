import { ApplicationServiceBase } from './application.service.base';
import {
  ApplicationContext,
  RelationshipResponseDto,
} from '../dtos/application.dtos';
import { ResourceNotFoundException } from '../exceptions/application.exceptions';
import { RelationshipRepository } from '@database/repositories/relationship.repository';
import { CompanionRepository } from '@database/repositories/companion.repository';

/**
 * Relationship Application Service
 * Orchestrates relationship operations
 * IMPORTANT: Business logic layer
 */
export class RelationshipApplicationService extends ApplicationServiceBase {
  private readonly relationshipRepository: RelationshipRepository;
  private readonly companionRepository: CompanionRepository;

  constructor() {
    super('RelationshipApplicationService');
    this.relationshipRepository = new RelationshipRepository();
    this.companionRepository = new CompanionRepository();
  }

  /**
   * Get current relationship state
   * Use Case: Fetch companion relationship
   */
  async getCurrentRelationship(
    context: ApplicationContext,
    companionId: string
  ): Promise<RelationshipResponseDto> {
    this.logStart('getCurrentRelationship', { userId: context.userId, companionId });

    try {
      const companion = await this.companionRepository.findById(companionId);
      if (!companion) {
        throw new ResourceNotFoundException('Companion', companionId);
      }

      const relationship = await this.relationshipRepository.findById(companionId);

      this.logSuccess('getCurrentRelationship', { userId: context.userId, companionId });

      return relationship ? this.mapRelationshipToDto(relationship) : this.mapRelationshipToDto({ id: companionId, companionId });
    } catch (error) {
      this.logError('getCurrentRelationship', error, { userId: context.userId, companionId });
      throw error;
    }
  }

  /**
   * Get relationship timeline
   * Use Case: View relationship evolution
   */
  async getRelationshipTimeline(
    context: ApplicationContext,
    companionId: string,
    limit: number = 50
  ): Promise<RelationshipResponseDto[]> {
    this.logStart('getRelationshipTimeline', { userId: context.userId, companionId });

    try {
      const companion = await this.companionRepository.findById(companionId);
      if (!companion) {
        throw new ResourceNotFoundException('Companion', companionId);
      }

      const relationships = await this.relationshipRepository.findByCompanionId(companionId, {
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      this.logSuccess('getRelationshipTimeline', {
        userId: context.userId,
        companionId,
        count: relationships.length,
      });

      return relationships.map((r: any) => this.mapRelationshipToDto(r));
    } catch (error) {
      this.logError('getRelationshipTimeline', error, { userId: context.userId, companionId });
      throw error;
    }
  }

  /**
   * Get relationship dimensions
   * Use Case: View relationship metrics
   */
  async getRelationshipDimensions(
    context: ApplicationContext,
    companionId: string
  ): Promise<Record<string, unknown>> {
    this.logStart('getRelationshipDimensions', { userId: context.userId, companionId });

    try {
      const companion = await this.companionRepository.findById(companionId);
      if (!companion) {
        throw new ResourceNotFoundException('Companion', companionId);
      }

      this.logSuccess('getRelationshipDimensions', { userId: context.userId, companionId });

      return {
        trust: 0,
        affection: 0,
        familiarity: 0,
        communication: 0,
        intimacy: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logError('getRelationshipDimensions', error, { userId: context.userId, companionId });
      throw error;
    }
  }

  /**
   * Get shared memories
   * Use Case: View relationship-specific memories
   */
  async getSharedMemories(
    context: ApplicationContext,
    companionId: string,
    limit: number = 50
  ): Promise<Record<string, unknown>[]> {
    this.logStart('getSharedMemories', { userId: context.userId, companionId, limit });

    try {
      const companion = await this.companionRepository.findById(companionId);
      if (!companion) {
        throw new ResourceNotFoundException('Companion', companionId);
      }

      this.logSuccess('getSharedMemories', {
        userId: context.userId,
        companionId,
        count: 0,
      });

      return [];
    } catch (error) {
      this.logError('getSharedMemories', error, { userId: context.userId, companionId });
      throw error;
    }
  }

  private mapRelationshipToDto(relationship: any): RelationshipResponseDto {
    return {
      id: relationship.id,
      companionId: relationship.companionId,
      targetUserId: relationship.targetUserId,
      type: relationship.type,
      state: relationship.state || 'active',
      metadata: relationship.metadata || {},
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt,
    };
  }
}
