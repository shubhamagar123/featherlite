/**
 * World Engine public API.
 *
 * Import from `@engines/world` rather than reaching into subpaths.
 */

// Factory (composition root)
export { getWorldEngine, resetWorldEngine } from './world.factory';
export type { WorldEngineDeps, WorldEngineContainer } from './world.factory';

// Engine, builder, scheduler, strategy
export { WorldEngine } from './world.engine';
export { WorldBuilder } from './builder/world.builder';
export { WorldScheduler } from './scheduler/world.scheduler';
export { DefaultWorldStrategy } from './strategies/default-world.strategy';
export type { DefaultWorldStrategyDeps } from './strategies/default-world.strategy';

// Context
export { WorldContext } from './context/world-context';

// Selectors (default implementations)
export { WeatherSelector } from './selectors/weather.selector';
export { SceneSelector } from './selectors/scene.selector';
export { ActivitySelector } from './selectors/activity.selector';
export { OutfitSelector } from './selectors/outfit.selector';
export { LightingSelector } from './selectors/lighting.selector';
export { AmbientSelector } from './selectors/ambient.selector';
export { MusicSelector } from './selectors/music.selector';
export { HouseStateSelector } from './selectors/house-state.selector';

// Interfaces
export type { IWorldEngine, WorldOverrideDTO } from './interfaces/world-engine.interface';
export type { IWorldBuilder } from './interfaces/world-builder.interface';
export type { IWorldScheduler } from './interfaces/world-scheduler.interface';
export type { IWorldStrategy } from './interfaces/world-strategy.interface';
export type {
  IWeatherSelector,
  ISceneSelector,
  IActivitySelector,
  IOutfitSelector,
  ILightingSelector,
  IAmbientSelector,
  IMusicSelector,
  IHouseStateSelector,
  WeatherSelectionInput,
  ISceneSelectorInput,
  IActivitySelectorInput,
  IOutfitSelectorInput,
  ILightingSelectorInput,
  IAmbientSelectorInput,
  IMusicSelectorInput,
  IHouseStateSelectorInput,
} from './interfaces/selectors.interface';

// DTOs
export type {
  GenerateWorldOptions,
  GeneratedWorldDTO,
  HouseStateDTO,
  WorldSignals,
} from './dtos/world-generation.dto';

// Enums
export {
  WorldMode,
  TimeOfDay,
  Season,
  Weather,
  Scene,
  Activity,
  Outfit,
  Lighting,
  AmbientSound,
  Music,
  Openable,
  Toggle,
  PlantState,
  KitchenState,
} from './enums/world.enums';

// Utilities
export { SystemClock, FixedClock } from './utils/clock.util';
export type { Clock } from './utils/clock.util';
export { DeterministicRandom, fnv1a, mulberry32 } from './utils/seed.util';
export type { WeightedOption } from './utils/seed.util';
export {
  deriveTimeOfDay,
  deriveSeason,
  getLocalDateKey,
  getLocalDateParts,
  getNextLocalMidnight,
} from './utils/date.util';
