import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';
import { InternalServerError } from '@utils/error';
import { getContextEngine } from '@engines/context';
import type { IContextEngine } from '@engines/context';

export interface PresenceResolutionDto {
  companion: {
    available: boolean;
    state?: string;
    mood?: string;
    expression?: string;
    gesture?: string;
    location?: string;
    outfit?: string;
    availability?: string;
  };
  world: {
    available: boolean;
    scene?: string;
    timeOfDay?: string;
    season?: string;
    weather?: string;
    activity?: string;
    lighting?: string;
    ambientSound?: string;
    mood?: string;
  };
  generatedAt: string;
}

/**
 * Presence Application Service
 * Resolves the current companion/world state for the client's video and
 * light-state resolver.
 *
 * IMPORTANT: Consumes the Context Engine exclusively — never touches the
 * World, Companion, or Relationship engines directly (per the "API layer
 * sees only Context Engine" boundary rule).
 */
export class PresenceApplicationService extends ApplicationServiceBase {
  private readonly contextEngine: IContextEngine;

  constructor() {
    super('PresenceApplicationService');
    this.contextEngine = getContextEngine();
  }

  async resolve(context: ApplicationContext, companionId: string): Promise<PresenceResolutionDto> {
    this.logStart('resolve', { userId: context.userId, companionId });

    try {
      const result = await this.contextEngine.assembleContext({
        userId: context.userId,
        companionId,
      });

      if (!result.isSuccess || !result.value) {
        throw new InternalServerError(result.error?.message ?? 'Failed to assemble context');
      }

      const { companion, world, generatedAt } = result.value;

      this.logSuccess('resolve', { userId: context.userId, companionId });

      return {
        companion: {
          available: companion.available,
          state: companion.state,
          mood: companion.mood,
          expression: companion.expression,
          gesture: companion.gesture,
          location: companion.location,
          outfit: companion.outfit,
          availability: companion.availability,
        },
        world: {
          available: world.available,
          scene: world.scene,
          timeOfDay: world.timeOfDay,
          season: world.season,
          weather: world.weather,
          activity: world.activity,
          lighting: world.lighting,
          ambientSound: world.ambientSound,
          mood: world.mood,
        },
        generatedAt,
      };
    } catch (error) {
      this.logError('resolve', error, { userId: context.userId, companionId });
      throw error;
    }
  }
}
