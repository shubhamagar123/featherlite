import { Scene, Weather } from '@engines/world';
import { DefaultCompanionRules } from '../rules/companion.rules';
import { Chronotype, CompanionLocation, CompanionMood, CompanionState } from '../enums/companion.enums';
import { makeContext } from './helpers';

describe('DefaultCompanionRules', () => {
  const rules = new DefaultCompanionRules();

  describe('mapWorldActivityToState', () => {
    it.each([
      ['WORKING', CompanionState.WORKING],
      ['COOKING', CompanionState.COOKING],
      ['WATCHING_TV', CompanionState.RELAXING],
      ['GYM', CompanionState.WALKING],
      ['CLEANING', CompanionState.BUSY],
      ['UNKNOWN', CompanionState.IDLE],
    ])('%s -> %s', (activity, expected) => {
      expect(rules.mapWorldActivityToState(activity)).toBe(expected);
    });
  });

  describe('mapWorldSceneToLocation', () => {
    it('maps park to garden and drive to cafe', () => {
      expect(rules.mapWorldSceneToLocation(Scene.PARK)).toBe(CompanionLocation.GARDEN);
      expect(rules.mapWorldSceneToLocation(Scene.DRIVE)).toBe(CompanionLocation.CAFE);
      expect(rules.mapWorldSceneToLocation(Scene.KITCHEN)).toBe(CompanionLocation.KITCHEN);
    });
  });

  describe('isConfiningWeather', () => {
    it('confines during storm and rain, not when sunny', () => {
      expect(rules.isConfiningWeather(Weather.STORM)).toBe(true);
      expect(rules.isConfiningWeather(Weather.RAIN)).toBe(true);
      expect(rules.isConfiningWeather(Weather.SUNNY)).toBe(false);
    });
  });

  describe('deriveMood', () => {
    it('returns LOW_ENERGY while sleeping regardless of anything else', () => {
      const context = makeContext();
      expect(rules.deriveMood({ context, state: CompanionState.SLEEPING })).toBe(
        CompanionMood.LOW_ENERGY
      );
    });

    it('is deterministic for the same context + state', () => {
      const context = makeContext();
      const a = rules.deriveMood({ context, state: CompanionState.WORKING });
      const b = rules.deriveMood({ context, state: CompanionState.WORKING });
      expect(a).toBe(b);
    });

    it('always returns a valid mood', () => {
      const moods = Object.values(CompanionMood);
      for (const state of Object.values(CompanionState)) {
        const context = makeContext({}, {}, {});
        expect(moods).toContain(rules.deriveMood({ context, state }));
      }
    });

    it('reflects a celebratory world with an energetic mood for an excited profile', () => {
      // High-energy, playful personality in a celebratory world should never be
      // sleepy/low-energy while active.
      const context = makeContext(
        {
          preferences: {
            chronotype: Chronotype.BALANCED,
            personality: { playfulness: 0.9, focus: 0.3, warmth: 0.8, energy: 0.95 },
            favoriteActivities: [],
            preferredOutfits: [],
          },
        },
        { mood: 'celebratory' }
      );
      const mood = rules.deriveMood({ context, state: CompanionState.GAMING });
      expect(mood).not.toBe(CompanionMood.LOW_ENERGY);
    });
  });
});
