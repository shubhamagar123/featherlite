import { WorldState } from '@prisma/client';
import { WorldStateDTO, WorldStateDetailDTO, WorldMetadataDTO, WorldEnvironmentDTO } from '../dtos/world.dto';

export class WorldMapper {
  static toDTO(world: WorldState): WorldStateDTO {
    return {
      id: world.id,
      companionId: world.companionId,
      currentScene: world.currentScene || undefined,
      timeOfDay: world.timeOfDay,
      season: world.season,
      globalMood: world.globalMood || undefined,
      gravity: world.gravity,
      timeScale: world.timeScale,
      dayLengthHours: world.dayLengthHours,
      createdAt: world.createdAt,
      updatedAt: world.updatedAt,
    };
  }

  static toDetailDTO(world: WorldState, sceneCount: number = 0, weatherCount: number = 0): WorldStateDetailDTO {
    return {
      ...this.toDTO(world),
      sceneCount,
      weatherDataCount: weatherCount,
    };
  }

  static toMetadataDTO(world: WorldState): WorldMetadataDTO {
    return {
      companionId: world.companionId,
      currentScene: world.currentScene || undefined,
      timeOfDay: world.timeOfDay,
      season: world.season,
    };
  }

  static toEnvironmentDTO(world: WorldState): WorldEnvironmentDTO {
    return {
      timeOfDay: world.timeOfDay,
      season: world.season,
      globalMood: world.globalMood || undefined,
    };
  }
}
