import { Result } from '@services/types/result.type';
import { IWorldService } from '@services/world/world.service.interface';
import { WorldStateDTO } from '@services/dtos/world.dto';

import { WorldEngine } from '../world.engine';
import { WorldBuilder } from '../builder/world.builder';
import { FixedClock } from '../utils/clock.util';
import { Scene, TimeOfDay } from '../enums/world.enums';
import { GenerateWorldOptions } from '../dtos/world-generation.dto';

const FIXED_DATE = new Date('2026-07-07T10:00:00Z');

function makeWorldStateDTO(overrides: Partial<WorldStateDTO> = {}): WorldStateDTO {
  return {
    id: 'world-1',
    companionId: 'companion-1',
    currentScene: undefined,
    timeOfDay: 'MORNING',
    season: 'SUMMER',
    globalMood: undefined,
    gravity: 9.8,
    timeScale: 1,
    dayLengthHours: 24,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

function makeWorldService(): jest.Mocked<IWorldService> {
  return {
    getWorldByCompanionId: jest.fn(),
    updateWorldState: jest.fn(),
    updateEnvironment: jest.fn(),
    updateCurrentScene: jest.fn(),
    refreshWorldState: jest.fn(),
  };
}

const OPTIONS: GenerateWorldOptions = {
  companionId: 'companion-1',
  referenceDate: FIXED_DATE,
  timezone: 'UTC',
};

describe('WorldEngine', () => {
  let worldService: jest.Mocked<IWorldService>;
  let engine: WorldEngine;

  beforeEach(() => {
    worldService = makeWorldService();
    engine = new WorldEngine(worldService, new WorldBuilder(), new FixedClock(FIXED_DATE));
  });

  describe('generate', () => {
    it('is pure and does not touch the service', () => {
      const world = engine.generate(OPTIONS);
      expect(world.companionId).toBe('companion-1');
      expect(worldService.getWorldByCompanionId).not.toHaveBeenCalled();
    });

    it('is deterministic', () => {
      const a = engine.generate(OPTIONS);
      const b = engine.generate(OPTIONS);
      expect({ ...a, generatedAt: '' }).toEqual({ ...b, generatedAt: '' });
    });
  });

  describe('createTodaysWorld', () => {
    it('persists the environment scalars and returns the world', async () => {
      worldService.getWorldByCompanionId.mockResolvedValue(Result.success(makeWorldStateDTO()));
      worldService.updateWorldState.mockResolvedValue(Result.success(makeWorldStateDTO()));

      const result = await engine.createTodaysWorld(OPTIONS);

      expect(result.isSuccess).toBe(true);
      expect(worldService.updateWorldState).toHaveBeenCalledTimes(1);
      const [worldId, patch] = worldService.updateWorldState.mock.calls[0]!;
      expect(worldId).toBe('world-1');
      expect(patch.timeOfDay).toBe(result.value!.timeOfDay);
      expect(patch.currentScene).toBe(result.value!.scene);
      expect(patch.globalMood).toBe(result.value!.mood);
    });

    it('still succeeds when there is no WorldState to persist into', async () => {
      worldService.getWorldByCompanionId.mockResolvedValue(
        Result.failure(new Error('not found'))
      );

      const result = await engine.createTodaysWorld(OPTIONS);

      expect(result.isSuccess).toBe(true);
      expect(worldService.updateWorldState).not.toHaveBeenCalled();
    });
  });

  describe('updateWorldState', () => {
    it('applies a scene override and persists it', async () => {
      worldService.getWorldByCompanionId.mockResolvedValue(Result.success(makeWorldStateDTO()));
      worldService.updateWorldState.mockResolvedValue(Result.success(makeWorldStateDTO()));

      const result = await engine.updateWorldState(OPTIONS, { scene: Scene.POOL });

      expect(result.isSuccess).toBe(true);
      expect(result.value!.scene).toBe(Scene.POOL);
      const [, patch] = worldService.updateWorldState.mock.calls[0]!;
      expect(patch.currentScene).toBe(Scene.POOL);
    });

    it('ignores an invalid scene override and keeps the generated scene', async () => {
      worldService.getWorldByCompanionId.mockResolvedValue(Result.success(makeWorldStateDTO()));
      worldService.updateWorldState.mockResolvedValue(Result.success(makeWorldStateDTO()));

      const base = engine.generate(OPTIONS);
      const result = await engine.updateWorldState(OPTIONS, { scene: 'NOT_A_SCENE' });

      expect(result.value!.scene).toBe(base.scene);
    });
  });

  describe('getCurrentWorld', () => {
    it('overlays a persisted scene/mood onto the generated world', async () => {
      worldService.getWorldByCompanionId.mockResolvedValue(
        Result.success(
          makeWorldStateDTO({ currentScene: Scene.STUDY, globalMood: 'focused' })
        )
      );

      const result = await engine.getCurrentWorld(OPTIONS);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.scene).toBe(Scene.STUDY);
      expect(result.value!.mood).toBe('focused');
    });

    it('returns the pure generated world when nothing is persisted', async () => {
      worldService.getWorldByCompanionId.mockResolvedValue(
        Result.failure(new Error('not found'))
      );

      const base = engine.generate(OPTIONS);
      const result = await engine.getCurrentWorld(OPTIONS);

      expect(result.value!.scene).toBe(base.scene);
      expect(result.value!.timeOfDay).toBe(TimeOfDay.MORNING);
    });
  });
});
