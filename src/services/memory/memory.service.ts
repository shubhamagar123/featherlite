import { BaseService } from '../base/base.service';
import { IMemoryService } from './memory.service.interface';
import { IResult, Result } from '../types/result.type';
import { MemoryRepository } from '@database/repositories/memory.repository';
import { MemoryDTO, CreateMemoryDTO, UpdateMemoryDTO } from '../dtos/memory.dto';
import { MemoryMapper } from '../mappers/memory.mapper';
import { InputValidator } from '../validators/input.validators';
import { NotFoundError } from '../exceptions';

export class MemoryService extends BaseService implements IMemoryService {
  constructor(private readonly memoryRepository: MemoryRepository) {
    super();
  }

  async createMemory(dto: CreateMemoryDTO): Promise<IResult<MemoryDTO>> {
    try {
      InputValidator.requireValidUUID(dto.userId, 'userId');
      InputValidator.requireValidUUID(dto.companionId, 'companionId');
      InputValidator.requireNotEmpty(dto.content, 'content');
      InputValidator.requireNotEmpty(dto.type, 'type');
      InputValidator.requireNotEmpty(dto.importance, 'importance');

      const memory = await this.memoryRepository.create({
        userId: dto.userId,
        companionId: dto.companionId,
        content: dto.content,
        type: dto.type as any,
        importance: dto.importance as any,
        accessCount: 0,
      } as any);

      this.logBusinessEvent('memory_created', {
        memoryId: memory.id,
        companionId: dto.companionId,
        type: dto.type,
      });

      return Result.success(MemoryMapper.toDTO(memory));
    } catch (error) {
      this.logError(error as Error, 'Failed to create memory');
      return Result.failure(new Error('Failed to create memory'));
    }
  }

  async getMemoryById(memoryId: string): Promise<IResult<MemoryDTO>> {
    try {
      InputValidator.requireValidUUID(memoryId, 'memoryId');
      const memory = await this.memoryRepository.findById(memoryId);
      if (!memory) return Result.failure(new NotFoundError('Memory', memoryId));
      return Result.success(MemoryMapper.toDTO(memory));
    } catch (error) {
      this.logError(error as Error, 'Failed to get memory');
      return Result.failure(new Error('Failed to get memory'));
    }
  }

  async getMemoriesByCompanionId(companionId: string, limit: number = 50): Promise<IResult<MemoryDTO[]>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      InputValidator.requirePositive(limit, 'limit');
      const memories = await this.memoryRepository.findByCompanionId(companionId, { take: limit });
      return Result.success(MemoryMapper.toDTOArray(memories));
    } catch (error) {
      this.logError(error as Error, 'Failed to get memories');
      return Result.failure(new Error('Failed to get memories'));
    }
  }

  async getCriticalMemories(companionId: string, limit: number = 10): Promise<IResult<MemoryDTO[]>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      InputValidator.requirePositive(limit, 'limit');
      const memories = await this.memoryRepository.findByCompanionId(companionId, { take: limit });
      return Result.success(MemoryMapper.toDTOArray(memories));
    } catch (error) {
      this.logError(error as Error, 'Failed to get critical memories');
      return Result.failure(new Error('Failed to get critical memories'));
    }
  }

  async updateMemory(memoryId: string, dto: UpdateMemoryDTO): Promise<IResult<MemoryDTO>> {
    try {
      InputValidator.requireValidUUID(memoryId, 'memoryId');
      if (dto.content) InputValidator.requireNotEmpty(dto.content, 'content');
      if (dto.type) InputValidator.requireNotEmpty(dto.type, 'type');
      if (dto.importance) InputValidator.requireNotEmpty(dto.importance, 'importance');

      const memory = await this.memoryRepository.update(memoryId, {
        content: dto.content,
        type: dto.type as any,
        importance: dto.importance as any,
      });

      this.logBusinessEvent('memory_updated', { memoryId });

      return Result.success(MemoryMapper.toDTO(memory));
    } catch (error) {
      this.logError(error as Error, 'Failed to update memory');
      return Result.failure(new Error('Failed to update memory'));
    }
  }

  async deleteMemory(memoryId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(memoryId, 'memoryId');
      await this.memoryRepository.softDelete(memoryId);
      this.logBusinessEvent('memory_deleted', { memoryId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to delete memory');
      return Result.failure(new Error('Failed to delete memory'));
    }
  }

  async incrementAccessCount(memoryId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(memoryId, 'memoryId');
      await this.memoryRepository.incrementAccessCount(memoryId);
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to increment access count');
      return Result.failure(new Error('Failed to increment access count'));
    }
  }
}
