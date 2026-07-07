import { Result } from '@services/types/result.type';

import { WorldScheduler } from '../scheduler/world.scheduler';
import { IWorldEngine } from '../interfaces/world-engine.interface';
import { GeneratedWorldDTO, GenerateWorldOptions } from '../dtos/world-generation.dto';
import { FixedClock } from '../utils/clock.util';
import {
  Activity,
  AmbientSound,
  KitchenState,
  Lighting,
  Music,
  Openable,
  Outfit,
  PlantState,
  Scene,
  Season,
  TimeOfDay,
  Toggle,
  Weather,
  WorldMode,
} from '../enums/world.enums';

const NOW = new Date('2026-07-07T13:00:00Z');

function fakeWorld(date: string): GeneratedWorldDTO {
  return {
    companionId: 'companion-1',
    date,
    timezone: 'UTC',
    mode: WorldMode.HOME,
    timeOfDay: TimeOfDay.AFTERNOON,
    season: Season.SUMMER,
    weather: Weather.SUNNY,
    scene: Scene.LIVING_ROOM,
    activity: Activity.RELAXING,
    outfit: Outfit.HOME_WEAR,
    lighting: Lighting.BRIGHT,
    ambientSound: AmbientSound.SILENCE,
    music: Music.LOFI,
    houseState: {
      curtains: Openable.OPEN,
      doors: Openable.CLOSED,
      tv: Toggle.OFF,
      music: Toggle.ON,
      lights: Toggle.OFF,
      plants: PlantState.NEUTRAL,
      kitchen: KitchenState.IDLE,
      objects: [],
    },
    mood: 'content',
    seed: 123,
    generatedAt: NOW.toISOString(),
  };
}

function makeEngine(): jest.Mocked<IWorldEngine> {
  return {
    generate: jest.fn(),
    createTodaysWorld: jest.fn().mockResolvedValue(Result.success(fakeWorld('2026-07-07'))),
    getCurrentWorld: jest.fn().mockResolvedValue(Result.success(fakeWorld('2026-07-07'))),
    refreshWorld: jest.fn(),
    updateWorldState: jest.fn(),
  };
}

const OPTIONS: GenerateWorldOptions = { companionId: 'companion-1', timezone: 'UTC' };

describe('WorldScheduler', () => {
  let engine: jest.Mocked<IWorldEngine>;
  let scheduler: WorldScheduler;

  beforeEach(() => {
    engine = makeEngine();
    scheduler = new WorldScheduler(engine, new FixedClock(NOW));
  });

  describe('isStale', () => {
    it('is fresh for the current local day', () => {
      expect(scheduler.isStale('2026-07-07', 'UTC')).toBe(false);
    });

    it('is stale for a previous local day', () => {
      expect(scheduler.isStale('2026-07-06', 'UTC')).toBe(true);
    });
  });

  describe('nextRefreshAt', () => {
    it('returns the next local midnight', () => {
      const next = scheduler.nextRefreshAt('UTC');
      expect(next.getTime()).toBeGreaterThan(NOW.getTime());
    });
  });

  describe('ensureFreshWorld', () => {
    it('regenerates when the last known day is stale', async () => {
      await scheduler.ensureFreshWorld(OPTIONS, '2026-07-06');
      expect(engine.createTodaysWorld).toHaveBeenCalledTimes(1);
      expect(engine.getCurrentWorld).not.toHaveBeenCalled();
    });

    it('regenerates when no last known day is provided', async () => {
      await scheduler.ensureFreshWorld(OPTIONS);
      expect(engine.createTodaysWorld).toHaveBeenCalledTimes(1);
    });

    it('returns the current world when still fresh', async () => {
      await scheduler.ensureFreshWorld(OPTIONS, '2026-07-07');
      expect(engine.getCurrentWorld).toHaveBeenCalledTimes(1);
      expect(engine.createTodaysWorld).not.toHaveBeenCalled();
    });
  });
});
