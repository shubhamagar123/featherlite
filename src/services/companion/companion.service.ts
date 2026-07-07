import { BaseService } from '../base/base.service';
import { ICompanionService } from './companion.service.interface';
import { IResult, Result } from '../types/result.type';
import { CompanionRepository } from '@database/repositories/companion.repository';
import { CompanionDTO, CompanionMetadataDTO } from '../dtos/companion.dto';
import { CompanionMapper } from '../mappers/companion.mapper';
import { InputValidator } from '../validators/input.validators';
import { NotFoundError } from '../exceptions';

export class CompanionService extends BaseService implements ICompanionService {
  constructor(private readonly companionRepository: CompanionRepository) {
    super();
  }

  async getCompanionById(companionId: string): Promise<IResult<CompanionDTO>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      const companion = await this.companionRepository.findById(companionId);
      if (!companion) return Result.failure(new NotFoundError('Companion', companionId));
      return Result.success(CompanionMapper.toDTO(companion));
    } catch (error) {
      this.logError(error as Error, 'Failed to get companion');
      return Result.failure(new Error('Failed to get companion'));
    }
  }

  async getCompanionByUserIdAndName(userId: string, name: string): Promise<IResult<CompanionDTO>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requireNotEmpty(name, 'name');
      const companion = await this.companionRepository.findByUserIdAndName(userId, name);
      if (!companion) return Result.failure(new NotFoundError('Companion', `${name} for user ${userId}`));
      return Result.success(CompanionMapper.toDTO(companion));
    } catch (error) {
      this.logError(error as Error, 'Failed to get companion by name');
      return Result.failure(new Error('Failed to get companion by name'));
    }
  }

  async getCompanionsByUserId(userId: string, limit: number = 50): Promise<IResult<CompanionDTO[]>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requirePositive(limit, 'limit');
      const companions = await this.companionRepository.findByUserId(userId, { take: limit });
      return Result.success(CompanionMapper.toDTOArray(companions));
    } catch (error) {
      this.logError(error as Error, 'Failed to get companions');
      return Result.failure(new Error('Failed to get companions'));
    }
  }

  async getActiveCompanionsByUserId(userId: string, limit: number = 50): Promise<IResult<CompanionDTO[]>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requirePositive(limit, 'limit');
      const companions = await this.companionRepository.findActiveByUserId(userId, { take: limit });
      return Result.success(CompanionMapper.toDTOArray(companions));
    } catch (error) {
      this.logError(error as Error, 'Failed to get active companions');
      return Result.failure(new Error('Failed to get active companions'));
    }
  }

  async getCompanionsByHighestAffection(userId: string, limit: number = 10): Promise<IResult<CompanionDTO[]>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requirePositive(limit, 'limit');
      const companions = await this.companionRepository.findByHighestAffection(userId, limit);
      return Result.success(CompanionMapper.toDTOArray(companions));
    } catch (error) {
      this.logError(error as Error, 'Failed to get companions by affection');
      return Result.failure(new Error('Failed to get companions by affection'));
    }
  }

  async getDefaultCompanions(userId: string): Promise<IResult<CompanionMetadataDTO[]>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      // TODO: Fetch default companions (Kai, Kia) for user
      // For now, return empty array as placeholder
      return Result.success([]);
    } catch (error) {
      this.logError(error as Error, 'Failed to get default companions');
      return Result.failure(new Error('Failed to get default companions'));
    }
  }

  async updateCompanionAffection(companionId: string, delta: number): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      await this.companionRepository.updateAffectionLevel(companionId, delta);
      this.logBusinessEvent('companion_affection_updated', { companionId, delta });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to update companion affection');
      return Result.failure(new Error('Failed to update companion affection'));
    }
  }

  async updateCompanionEngagement(companionId: string, score: number): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      InputValidator.requireInRange(score, 0, 1, 'score');
      await this.companionRepository.updateEngagementScore(companionId, score);
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to update companion engagement');
      return Result.failure(new Error('Failed to update companion engagement'));
    }
  }

  async updateCompanionLastInteraction(companionId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      await this.companionRepository.updateLastInteraction(companionId);
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to update companion last interaction');
      return Result.failure(new Error('Failed to update companion last interaction'));
    }
  }

  async incrementConversationCount(companionId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      await this.companionRepository.incrementTotalConversations(companionId);
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to increment conversation count');
      return Result.failure(new Error('Failed to increment conversation count'));
    }
  }

  async incrementMessageCount(companionId: string, count: number = 1): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      InputValidator.requirePositive(count, 'count');
      await this.companionRepository.incrementTotalMessages(companionId, count);
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to increment message count');
      return Result.failure(new Error('Failed to increment message count'));
    }
  }
}
