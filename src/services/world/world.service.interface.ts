import { IResult } from '../types/result.type';
import { WorldStateDTO } from '../dtos/world.dto';
import { UpdateWorldStateDTO } from '../dtos/world.dto';

export interface IWorldService {
  getWorldByCompanionId(companionId: string): Promise<IResult<WorldStateDTO>>;
  updateWorldState(worldId: string, dto: UpdateWorldStateDTO): Promise<IResult<WorldStateDTO>>;
  updateEnvironment(worldId: string, timeOfDay: string, season: string, mood?: string): Promise<IResult<void>>;
  updateCurrentScene(worldId: string, sceneId: string): Promise<IResult<void>>;
  refreshWorldState(companionId: string): Promise<IResult<WorldStateDTO>>;
}
