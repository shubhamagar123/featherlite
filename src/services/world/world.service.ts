import { BaseService } from '../base/base.service';
import { IWorldService } from './world.service.interface';
import { IResult, Result } from '../types/result.type';
import { WorldRepository } from '@database/repositories/world.repository';
import { WorldStateDTO, UpdateWorldStateDTO } from '../dtos/world.dto';
import { WorldMapper } from '../mappers/world.mapper';
import { InputValidator } from '../validators/input.validators';
import { NotFoundError } from '../exceptions';

export class WorldService extends BaseService implements IWorldService {
  constructor(private readonly worldRepository: WorldRepository) {
    super();
  }

  async getWorldByCompanionId(companionId: string): Promise<IResult<WorldStateDTO>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      const world = await this.worldRepository.findByCompanionId(companionId);
      if (!world) return Result.failure(new NotFoundError('World', `companionId: ${companionId}`));
      return Result.success(WorldMapper.toDTO(world));
    } catch (error) {
      this.logError(error as Error, 'Failed to get world');
      return Result.failure(new Error('Failed to get world'));
    }
  }

  async updateWorldState(worldId: string, dto: UpdateWorldStateDTO): Promise<IResult<WorldStateDTO>> {
    try {
      InputValidator.requireValidUUID(worldId, 'worldId');
      if (dto.timeOfDay) InputValidator.requireNotEmpty(dto.timeOfDay, 'timeOfDay');
      if (dto.season) InputValidator.requireNotEmpty(dto.season, 'season');

      const world = await this.worldRepository.update(worldId, {
        timeOfDay: dto.timeOfDay,
        season: dto.season,
        globalMood: dto.globalMood,
        gravity: dto.gravity,
        timeScale: dto.timeScale,
        dayLengthHours: dto.dayLengthHours,
      });

      this.logBusinessEvent('world_state_updated', { worldId });

      return Result.success(WorldMapper.toDTO(world));
    } catch (error) {
      this.logError(error as Error, 'Failed to update world state');
      return Result.failure(new Error('Failed to update world state'));
    }
  }

  async updateEnvironment(worldId: string, timeOfDay: string, season: string, mood?: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(worldId, 'worldId');
      InputValidator.requireNotEmpty(timeOfDay, 'timeOfDay');
      InputValidator.requireNotEmpty(season, 'season');
      if (mood) InputValidator.requireNotEmpty(mood, 'mood');

      await this.worldRepository.update(worldId, {
        timeOfDay,
        season,
        globalMood: mood,
      });

      this.logBusinessEvent('world_environment_updated', { worldId, timeOfDay, season });

      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to update environment');
      return Result.failure(new Error('Failed to update environment'));
    }
  }

  async updateCurrentScene(worldId: string, sceneId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(worldId, 'worldId');
      InputValidator.requireValidUUID(sceneId, 'sceneId');

      await this.worldRepository.update(worldId, {
        currentScene: sceneId,
      });

      this.logBusinessEvent('world_scene_updated', { worldId, sceneId });

      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to update current scene');
      return Result.failure(new Error('Failed to update current scene'));
    }
  }

  async refreshWorldState(companionId: string): Promise<IResult<WorldStateDTO>> {
    try {
      InputValidator.requireValidUUID(companionId, 'companionId');
      const world = await this.worldRepository.findByCompanionId(companionId);
      if (!world) return Result.failure(new NotFoundError('World', `companionId: ${companionId}`));

      this.logBusinessEvent('world_state_refreshed', { companionId, worldId: world.id });

      return Result.success(WorldMapper.toDTO(world));
    } catch (error) {
      this.logError(error as Error, 'Failed to refresh world state');
      return Result.failure(new Error('Failed to refresh world state'));
    }
  }
}
