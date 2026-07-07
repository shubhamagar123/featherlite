/**
 * WorldBuilder — orchestrates generation.
 *
 * It runs the strategy's selectors in strict dependency order and assembles the
 * final GeneratedWorldDTO. The builder is pure: no services, no clock, no I/O.
 * All time comes pre-resolved on the WorldContext.
 *
 * Dependency order (each step may read everything resolved above it):
 *   timeOfDay -> season -> mode -> weather -> scene -> activity -> outfit
 *   -> lighting -> ambient -> music -> houseState
 */

import { Season, TimeOfDay, Weather, WorldMode } from '../enums/world.enums';
import { GeneratedWorldDTO } from '../dtos/world-generation.dto';
import { WorldContext } from '../context/world-context';
import { IWorldBuilder } from '../interfaces/world-builder.interface';
import { IWorldStrategy } from '../interfaces/world-strategy.interface';
import { DefaultWorldStrategy } from '../strategies/default-world.strategy';

export class WorldBuilder implements IWorldBuilder {
  constructor(private readonly strategy: IWorldStrategy = new DefaultWorldStrategy()) {}

  build(context: WorldContext): GeneratedWorldDTO {
    const timeOfDay = context.timeOfDay;
    const season = context.season;

    const mode = this.strategy.resolveMode(context);
    const weather = this.strategy.weatherSelector.select({ context, season });
    const scene = this.strategy.sceneSelector.select({ context, mode, timeOfDay, weather });
    const activity = this.strategy.activitySelector.select({ context, mode, timeOfDay, scene });
    const outfit = this.strategy.outfitSelector.select({ context, mode, scene, activity });
    const lighting = this.strategy.lightingSelector.select({ context, timeOfDay, weather });
    const ambientSound = this.strategy.ambientSelector.select({ context, weather, scene });
    const music = this.strategy.musicSelector.select({ context, mode, timeOfDay, activity });
    const houseState = this.strategy.houseStateSelector.select({
      context,
      timeOfDay,
      weather,
      scene,
      activity,
      music,
    });

    return {
      companionId: context.companionId,
      date: context.dateKey,
      timezone: context.timezone,
      mode,
      timeOfDay,
      season,
      weather,
      scene,
      activity,
      outfit,
      lighting,
      ambientSound,
      music,
      houseState,
      mood: this.deriveMood(mode, weather, timeOfDay, season),
      seed: context.seed,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Derive a human-readable emotional tone. This is the string persisted onto
   * the WorldState's `globalMood` column, so it stays short and descriptive.
   */
  private deriveMood(
    mode: WorldMode,
    weather: Weather,
    timeOfDay: TimeOfDay,
    season: Season
  ): string {
    if (mode === WorldMode.SPECIAL_MOMENT) return 'celebratory';

    if (weather === Weather.RAIN || weather === Weather.STORM) return 'cozy';
    if (weather === Weather.FOG) return 'contemplative';

    if (timeOfDay === TimeOfDay.MORNING) return 'fresh';
    if (timeOfDay === TimeOfDay.EVENING) return 'warm';
    if (timeOfDay === TimeOfDay.NIGHT) return 'calm';

    if (season === Season.SUMMER && weather === Weather.SUNNY) return 'bright';

    return 'content';
  }
}
