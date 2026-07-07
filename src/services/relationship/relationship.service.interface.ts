import { IResult } from '../types/result.type';
import { RelationshipDTO } from '../dtos/relationship.dto';
import { CreateRelationshipDTO, UpdateRelationshipDTO } from '../dtos/relationship.dto';

export interface IRelationshipService {
  createRelationship(dto: CreateRelationshipDTO): Promise<IResult<RelationshipDTO>>;
  getRelationshipById(relationshipId: string): Promise<IResult<RelationshipDTO>>;
  getRelationshipByUserAndCompanion(userId: string, companionId: string): Promise<IResult<RelationshipDTO>>;
  getRelationshipsByUserId(userId: string, limit?: number): Promise<IResult<RelationshipDTO[]>>;
  updateRelationship(relationshipId: string, dto: UpdateRelationshipDTO): Promise<IResult<RelationshipDTO>>;
  pauseRelationship(relationshipId: string): Promise<IResult<void>>;
  resumeRelationship(relationshipId: string): Promise<IResult<void>>;
  endRelationship(relationshipId: string): Promise<IResult<void>>;
  updateLastInteraction(relationshipId: string): Promise<IResult<void>>;
}
