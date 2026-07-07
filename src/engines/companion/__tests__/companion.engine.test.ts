import { Result } from '@services/types/result.type';
import { FixedClock, type IWorldEngine } from '@engines/world';

import { CompanionEngine, CompanionEngineDeps } from '../companion.engine';
import { CompanionRegistry } from '../registry/companion-registry';
import { DefaultCompanionRules } from '../rules/companion.rules';
import { CompanionScheduler } from '../scheduler/companion-scheduler';
import { CompanionStateMachine } from '../state/companion-state-machine';
import { CompanionTransitionManager } from '../transitions/companion-transition-manager';
import { ExpressionManager } from '../managers/expression.manager';
import { GestureManager } from '../managers/gesture.manager';
import { LocationManager } from '../managers/location.manager';
import { OutfitManager } from '../managers/outfit.manager';
import { AvailabilityManager } from '../managers/availability.manager';
import {
  Availability,
  CompanionLocation,
  CompanionMood,
  CompanionOutfit,
  CompanionState,
  Expression,
  Gesture,
} from '../enums/companion.enums';
import { makeProfile, makeWorld, TEST_DATE } from './helpers';

function makeWorldEngine(): jest.Mocked<IWorldEngine> {
  return {
    generate: jest.fn(),
    createTodaysWorld: jest.fn(),
    getCurrentWorld: jest.fn().mockResolvedValue(Result.success(makeWorld())),
    refreshWorld: jest.fn(),
    updateWorldState: jest.fn(),
  };
}

function buildEngine(overrides: Partial<CompanionEngineDeps> = {}) {
  const rules = new DefaultCompanionRules();
  const stateMachine = new CompanionStateMachine(rules);
  const registry = overrides.registry ?? new CompanionRegistry([makeProfile({ id: 'c1' })]);
  const worldEngine = overrides.worldEngine ?? makeWorldEngine();

  const engine = new CompanionEngine({
    registry,
    worldEngine,
    rules,
    scheduler: new CompanionScheduler(),
    stateMachine,
    transitionManager: new CompanionTransitionManager(stateMachine),
    locationManager: new LocationManager(rules),
    expressionManager: new ExpressionManager(),
    gestureManager: new GestureManager(),
    outfitManager: new OutfitManager(),
    availabilityManager: new AvailabilityManager(),
    clock: new FixedClock(TEST_DATE),
    ...overrides,
  });

  return { engine, worldEngine, registry };
}

const OPTIONS = { companionId: 'c1', referenceDate: TEST_DATE, timezone: 'UTC' };

describe('CompanionEngine', () => {
  describe('resolveState', () => {
    it('resolves a complete, valid life-state snapshot', async () => {
      const { engine } = buildEngine();
      const result = await engine.resolveState(OPTIONS);

      expect(result.isSuccess).toBe(true);
      const snap = result.value!;
      expect(snap.companionId).toBe('c1');
      expect(Object.values(CompanionState)).toContain(snap.state);
      expect(Object.values(CompanionMood)).toContain(snap.mood);
      expect(Object.values(Expression)).toContain(snap.expression);
      expect(Object.values(Gesture)).toContain(snap.gesture);
      expect(Object.values(CompanionLocation)).toContain(snap.location);
      expect(Object.values(CompanionOutfit)).toContain(snap.outfit);
      expect(Object.values(Availability)).toContain(snap.availability);
      expect(snap.scheduleLabel).toBeTruthy();
    });

    it('synchronizes with the World Engine when no world is supplied', async () => {
      const { engine, worldEngine } = buildEngine();
      await engine.resolveState(OPTIONS);
      expect(worldEngine.getCurrentWorld).toHaveBeenCalledWith(
        expect.objectContaining({ companionId: 'c1' })
      );
    });

    it('uses a supplied world without calling the World Engine', async () => {
      const { engine, worldEngine } = buildEngine();
      await engine.resolveState({ ...OPTIONS, world: makeWorld() });
      expect(worldEngine.getCurrentWorld).not.toHaveBeenCalled();
    });

    it('is deterministic (ignoring the resolvedAt timestamp)', async () => {
      const { engine } = buildEngine();
      const a = await engine.resolveState({ ...OPTIONS, world: makeWorld() });
      const b = await engine.resolveState({ ...OPTIONS, world: makeWorld() });
      expect({ ...a.value!, resolvedAt: '' }).toEqual({ ...b.value!, resolvedAt: '' });
    });

    it('reflects the schedule: the test profile is relaxing at 10:00', async () => {
      const { engine } = buildEngine();
      const result = await engine.resolveState({ ...OPTIONS, world: makeWorld() });
      // Morning block (06-12) is RELAXING.
      expect(result.value!.state).toBe(CompanionState.RELAXING);
      expect(result.value!.scheduleLabel).toBe('Morning');
    });

    it('fails with NotFound for an unregistered companion', async () => {
      const { engine } = buildEngine();
      const result = await engine.resolveState({ ...OPTIONS, companionId: 'ghost' });
      expect(result.isSuccess).toBe(false);
    });

    it('propagates a world synchronization failure', async () => {
      const worldEngine = makeWorldEngine();
      worldEngine.getCurrentWorld.mockResolvedValue(Result.failure(new Error('no world')));
      const { engine } = buildEngine({ worldEngine });
      const result = await engine.resolveState(OPTIONS);
      expect(result.isSuccess).toBe(false);
    });
  });

  describe('getAvailability', () => {
    it('returns the snapshot availability', async () => {
      const { engine } = buildEngine();
      const result = await engine.getAvailability({ ...OPTIONS, world: makeWorld() });
      expect(result.isSuccess).toBe(true);
      expect(Object.values(Availability)).toContain(result.value!);
    });
  });

  describe('planTransition', () => {
    it('plans from a previous state toward the resolved state', async () => {
      const { engine } = buildEngine();
      const result = await engine.planTransition({
        ...OPTIONS,
        world: makeWorld(),
        previousState: CompanionState.DRIVING,
      });
      expect(result.isSuccess).toBe(true);
      // Resolved state is RELAXING; from DRIVING that is not a direct edge.
      expect(result.value!.from).toBe(CompanionState.DRIVING);
      expect(result.value!.to).toBe(CompanionState.RELAXING);
      expect(result.value!.path.length).toBeGreaterThan(1);
    });
  });

  describe('getCurrentScheduleBlock', () => {
    it('returns the active block for the hour', async () => {
      const { engine } = buildEngine();
      const result = await engine.getCurrentScheduleBlock({ ...OPTIONS, world: makeWorld() });
      expect(result.isSuccess).toBe(true);
      expect(result.value!.label).toBe('Morning');
    });
  });

  describe('registry access', () => {
    it('lists companions and fetches profile/preferences', () => {
      const { engine } = buildEngine();
      expect(engine.listCompanions().map((p) => p.id)).toContain('c1');
      expect(engine.getProfile('c1').isSuccess).toBe(true);
      expect(engine.getPreferences('c1').isSuccess).toBe(true);
      expect(engine.getProfile('ghost').isSuccess).toBe(false);
    });
  });
});
