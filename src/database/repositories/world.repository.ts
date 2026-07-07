import { WorldState, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type WorldStateCreateInput = Prisma.WorldStateCreateInput;
type WorldStateUpdateInput = Prisma.WorldStateUpdateInput;

export class WorldRepository extends BaseRepository<WorldState, WorldStateCreateInput, WorldStateUpdateInput> {
  protected getDelegate() {
    return prisma.worldState;
  }

  protected getModelName(): string {
    return 'WorldState';
  }

  protected supportsSoftDelete(): boolean {
    return false;
  }

  async findByCompanionId(companionId: string): Promise<WorldState | null> {
    return this.findOne({ companionId });
  }

  async findAllByCompanionId(companionId: string, options?: FindManyOptions): Promise<WorldState[]> {
    return this.findMany({ companionId }, options);
  }

  async findByTimeOfDay(timeOfDay: string, options?: FindManyOptions): Promise<WorldState[]> {
    return this.findMany({ timeOfDay }, options);
  }

  async findByWeather(weather: string, options?: FindManyOptions): Promise<WorldState[]> {
    return this.findMany({ weather }, options);
  }

  async findByMood(mood: string, options?: FindManyOptions): Promise<WorldState[]> {
    return this.findMany({ mood }, options);
  }

  async findByLocation(location: string, options?: FindManyOptions): Promise<WorldState[]> {
    return this.findMany({ location }, options);
  }

  async findCreatedAfter(date: Date, options?: FindManyOptions): Promise<WorldState[]> {
    return this.findMany({ createdAt: { gte: date } }, options);
  }

  async findByCompanionIdWithScenes(companionId: string): Promise<(WorldState & { scenes: any[] }) | null> {
    try {
      return (await prisma.worldState.findUnique({
        where: { companionId },
        include: { scenes: { orderBy: { createdAt: 'desc' } as any } },
      })) as any;
    } catch (error) {
      throw error;
    }
  }

  async findByCompanionIdWithWeatherAndScenes(companionId: string): Promise<
    (WorldState & { weatherData: any[]; scenes: any[] }) | null
  > {
    try {
      return (await prisma.worldState.findUnique({
        where: { companionId },
        include: {
          weatherData: { orderBy: { createdAt: 'desc' } as any, take: 1 },
          scenes: { orderBy: { createdAt: 'desc' } as any },
        },
      })) as any;
    } catch (error) {
      throw error;
    }
  }

  async updateEnvironment(
    worldStateId: string,
    data: {
      timeOfDay?: string;
      season?: string;
      globalMood?: string;
    }
  ): Promise<WorldState> {
    return this.update(worldStateId, data as any);
  }

  async updateCurrentScene(worldStateId: string, sceneId: string): Promise<WorldState> {
    return this.update(worldStateId, { currentScene: sceneId } as any);
  }

  async updateGlobalMood(worldStateId: string, mood: string): Promise<WorldState> {
    return this.update(worldStateId, { globalMood: mood } as any);
  }

  async countByCompanionId(companionId: string): Promise<number> {
    return this.count({ companionId });
  }

  async existsByCompanionId(companionId: string): Promise<boolean> {
    return this.exists({ companionId });
  }
}
