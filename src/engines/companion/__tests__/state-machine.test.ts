import { Activity, Weather } from '@engines/world';
import { CompanionStateMachine } from '../state/companion-state-machine';
import { CompanionState } from '../enums/companion.enums';
import { CompanionScheduleBlockDTO } from '../dtos/companion.dtos';
import { makeContext } from './helpers';

describe('CompanionStateMachine', () => {
  const sm = new CompanionStateMachine();

  describe('transitions', () => {
    it('allows a direct, symmetric IDLE <-> WORKING edge', () => {
      expect(sm.canTransition(CompanionState.IDLE, CompanionState.WORKING)).toBe(true);
      expect(sm.canTransition(CompanionState.WORKING, CompanionState.IDLE)).toBe(true);
    });

    it('disallows a direct COOKING -> DRIVING jump', () => {
      expect(sm.canTransition(CompanionState.COOKING, CompanionState.DRIVING)).toBe(false);
    });

    it('treats identity as a valid transition', () => {
      expect(sm.canTransition(CompanionState.GAMING, CompanionState.GAMING)).toBe(true);
    });
  });

  describe('shortestPath', () => {
    it('routes COOKING to DRIVING via WALKING', () => {
      expect(sm.shortestPath(CompanionState.COOKING, CompanionState.DRIVING)).toEqual([
        CompanionState.COOKING,
        CompanionState.WALKING,
        CompanionState.DRIVING,
      ]);
    });

    it('returns a single-node path for equal endpoints', () => {
      expect(sm.shortestPath(CompanionState.IDLE, CompanionState.IDLE)).toEqual([
        CompanionState.IDLE,
      ]);
    });

    it('can reach every state from every other state (connected graph)', () => {
      for (const from of sm.states) {
        for (const to of sm.states) {
          expect(sm.shortestPath(from, to).length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('resolveState', () => {
    const block = (state: CompanionState): CompanionScheduleBlockDTO => ({
      label: 'b',
      startHour: 0,
      endHour: 24,
      state,
    });

    it('sleeps when the schedule says so', () => {
      const context = makeContext();
      expect(sm.resolveState(context, block(CompanionState.SLEEPING))).toBe(
        CompanionState.SLEEPING
      );
    });

    it('honours a BUSY status override above everything', () => {
      const context = makeContext({}, {}, { signals: { statusOverride: 'BUSY' } });
      expect(sm.resolveState(context, block(CompanionState.RELAXING))).toBe(CompanionState.BUSY);
    });

    it('follows the scheduled intent in fair weather', () => {
      const context = makeContext();
      expect(sm.resolveState(context, block(CompanionState.WORKING))).toBe(CompanionState.WORKING);
    });

    it('pulls an outdoor intent indoors during a storm', () => {
      const context = makeContext({}, { weather: Weather.STORM });
      expect(sm.resolveState(context, block(CompanionState.WALKING))).toBe(CompanionState.RELAXING);
    });

    it('falls back to the world activity when there is no block', () => {
      const context = makeContext({}, { activity: Activity.WORKING });
      expect(sm.resolveState(context, null)).toBe(CompanionState.WORKING);
    });
  });
});
