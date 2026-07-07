/**
 * WorldContextProvider — the single source for the world slice.
 *
 * Talks to the World Engine. Required: the environment is fundamental to a
 * conversation, so a failure aborts assembly. If the request carries a
 * pre-synchronized world, it is used verbatim for perfect consistency.
 */

import { IResult, Result } from '@services/types/result.type';
import type { IWorldEngine } from '@engines/world';
import { ContextRequest, WorldContextSlice } from '../dtos/conversation-context.dto';
import { ContextProviderKey, IContextProvider } from '../interfaces/context-provider.interface';

export class WorldContextProvider implements IContextProvider<WorldContextSlice> {
  readonly key: ContextProviderKey = 'world';
  readonly required = true;

  constructor(private readonly worldEngine: IWorldEngine) {}

  emptySlice(): WorldContextSlice {
    return { available: false };
  }

  async provide(request: ContextRequest): Promise<IResult<WorldContextSlice>> {
    let world = request.world;

    if (!world) {
      const result = await this.worldEngine.getCurrentWorld({
        companionId: request.companionId,
        referenceDate: request.referenceDate,
        timezone: request.timezone,
      });
      if (!result.isSuccess || !result.value) {
        return Result.failure(result.error ?? new Error('World unavailable'));
      }
      world = result.value;
    }

    return Result.success({
      available: true,
      scene: world.scene,
      timeOfDay: world.timeOfDay,
      season: world.season,
      weather: world.weather,
      activity: world.activity,
      lighting: world.lighting,
      ambientSound: world.ambientSound,
      mood: world.mood,
    });
  }
}
