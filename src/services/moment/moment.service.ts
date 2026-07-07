import { BaseService } from '../base/base.service';
import { IMomentService } from './moment.service.interface';
import { IResult, Result } from '../types/result.type';
import { MomentRepository } from '@database/repositories/moment.repository';
import { MomentDTO, CreateMomentDTO, UpdateMomentDTO } from '../dtos/moment.dto';
import { MomentMapper } from '../mappers/moment.mapper';
import { InputValidator } from '../validators/input.validators';
import { NotFoundError } from '../exceptions';

export class MomentService extends BaseService implements IMomentService {
  constructor(private readonly momentRepository: MomentRepository) {
    super();
  }

  async createMoment(dto: CreateMomentDTO): Promise<IResult<MomentDTO>> {
    try {
      InputValidator.requireValidUUID(dto.companionId, 'companionId');
      InputValidator.requireNotEmpty(dto.title, 'title');
      InputValidator.requireNotEmpty(dto.description, 'description');

      const moment = await this.momentRepository.create({
        companionId: dto.companionId,
        title: dto.title,
        description: dto.description,
        significance: dto.significance || 0.5,
      } as any);

      this.logBusinessEvent('moment_created', {
        momentId: moment.id,
        companionId: dto.companionId,
        title: dto.title,
      });

      return Result.success(MomentMapper.toDTO(moment));
    } catch (error) {
      this.logError(error as Error, 'Failed to create moment');
      return Result.failure(new Error('Failed to create moment'));
    }
  }

  async getMomentById(momentId: string): Promise<IResult<MomentDTO>> {
    try {
      InputValidator.requireValidUUID(momentId, 'momentId');
      const moment = await this.momentRepository.findById(momentId);
      if (!moment) return Result.failure(new NotFoundError('Moment', momentId));
      return Result.success(MomentMapper.toDTO(moment));
    } catch (error) {
      this.logError(error as Error, 'Failed to get moment');
      return Result.failure(new Error('Failed to get moment'));
    }
  }

  async getMomentsByCompanionId(companionId: string, limit: number = 50): Promise<IResult<MomentDTO[]>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      InputValidator.requirePositive(limit, 'limit');
      const moments = await this.momentRepository.findByCompanionId(companionId, { take: limit });
      return Result.success(MomentMapper.toDTOArray(moments));
    } catch (error) {
      this.logError(error as Error, 'Failed to get moments');
      return Result.failure(new Error('Failed to get moments'));
    }
  }

  async updateMoment(momentId: string, dto: UpdateMomentDTO): Promise<IResult<MomentDTO>> {
    try {
      InputValidator.requireValidUUID(momentId, 'momentId');
      if (dto.title) InputValidator.requireNotEmpty(dto.title, 'title');
      if (dto.description) InputValidator.requireNotEmpty(dto.description, 'description');
      if (dto.significance !== undefined) InputValidator.requireInRange(dto.significance, 0, 1, 'significance');

      const moment = await this.momentRepository.update(momentId, {
        title: dto.title,
        description: dto.description,
        significance: dto.significance,
      });

      this.logBusinessEvent('moment_updated', { momentId });

      return Result.success(MomentMapper.toDTO(moment));
    } catch (error) {
      this.logError(error as Error, 'Failed to update moment');
      return Result.failure(new Error('Failed to update moment'));
    }
  }

  async deleteMoment(momentId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(momentId, 'momentId');
      await this.momentRepository.softDelete(momentId);
      this.logBusinessEvent('moment_deleted', { momentId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to delete moment');
      return Result.failure(new Error('Failed to delete moment'));
    }
  }
}
