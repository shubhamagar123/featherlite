import { IResult } from '../types/result.type';
import { CompanionDTO, CompanionMetadataDTO } from '../dtos/companion.dto';

export interface ICompanionService {
  getCompanionById(companionId: string): Promise<IResult<CompanionDTO>>;
  getCompanionByUserIdAndName(userId: string, name: string): Promise<IResult<CompanionDTO>>;
  getCompanionsByUserId(userId: string, limit?: number): Promise<IResult<CompanionDTO[]>>;
  getActiveCompanionsByUserId(userId: string, limit?: number): Promise<IResult<CompanionDTO[]>>;
  getCompanionsByHighestAffection(userId: string, limit?: number): Promise<IResult<CompanionDTO[]>>;
  getDefaultCompanions(userId: string): Promise<IResult<CompanionMetadataDTO[]>>;
  updateCompanionAffection(companionId: string, delta: number): Promise<IResult<void>>;
  updateCompanionEngagement(companionId: string, score: number): Promise<IResult<void>>;
  updateCompanionLastInteraction(companionId: string): Promise<IResult<void>>;
  incrementConversationCount(companionId: string): Promise<IResult<void>>;
  incrementMessageCount(companionId: string, count?: number): Promise<IResult<void>>;
}
