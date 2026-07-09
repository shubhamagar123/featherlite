import { Scene, Weather, WorldMode, Outfit as WorldOutfit } from '@engines/world';
import { LocationManager } from '../managers/location.manager';
import { OutfitManager } from '../managers/outfit.manager';
import { ExpressionManager } from '../managers/expression.manager';
import { GestureManager } from '../managers/gesture.manager';
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
import { makeContext } from './helpers';

describe('LocationManager', () => {
  const manager = new LocationManager();

  it('always puts a cooking companion in the kitchen', () => {
    const context = makeContext();
    expect(manager.resolve({ context, state: CompanionState.COOKING }).getValueOrThrow()).toBe(
      CompanionLocation.KITCHEN
    );
  });

  it('never places a relaxing companion outdoors during a storm', () => {
    const outdoor = new Set([
      CompanionLocation.BALCONY,
      CompanionLocation.POOL,
      CompanionLocation.GARDEN,
    ]);
    for (let i = 0; i < 40; i++) {
      const context = makeContext({ id: `c-${i}` }, { weather: Weather.STORM });
      const location = manager.resolve({ context, state: CompanionState.RELAXING }).getValueOrThrow();
      expect(outdoor.has(location)).toBe(false);
    }
  });

  it('is deterministic', () => {
    const context = makeContext();
    expect(manager.resolve({ context, state: CompanionState.RELAXING }).getValueOrThrow()).toBe(
      manager.resolve({ context, state: CompanionState.RELAXING }).getValueOrThrow()
    );
  });
});

describe('OutfitManager', () => {
  const manager = new OutfitManager();

  it('wears travel clothes while driving', () => {
    const context = makeContext();
    expect(
      manager.resolve({ context, state: CompanionState.DRIVING, location: CompanionLocation.CAFE }).getValueOrThrow()
    ).toBe(CompanionOutfit.TRAVEL);
  });

  it('wears gym clothes at the gym', () => {
    const context = makeContext();
    expect(
      manager.resolve({ context, state: CompanionState.WALKING, location: CompanionLocation.GYM }).getValueOrThrow()
    ).toBe(CompanionOutfit.GYM);
  });

  it('dresses festive during a special moment', () => {
    const context = makeContext({}, { mode: WorldMode.SPECIAL_MOMENT });
    expect(
      manager.resolve({ context, state: CompanionState.RELAXING, location: CompanionLocation.CAFE }).getValueOrThrow()
    ).toBe(CompanionOutfit.FESTIVAL);
  });

  it('wears office attire working out, home wear working from home', () => {
    const context = makeContext();
    expect(
      manager.resolve({ context, state: CompanionState.WORKING, location: CompanionLocation.CAFE }).getValueOrThrow()
    ).toBe(CompanionOutfit.OFFICE);
    expect(
      manager.resolve({ context, state: CompanionState.WORKING, location: CompanionLocation.STUDY }).getValueOrThrow()
    ).toBe(CompanionOutfit.HOME);
  });

  it('synchronizes with the world outfit when out and casual', () => {
    const context = makeContext({}, { outfit: WorldOutfit.CASUAL, scene: Scene.CAFE });
    expect(
      manager.resolve({ context, state: CompanionState.WALKING, location: CompanionLocation.CAFE }).getValueOrThrow()
    ).toBe(CompanionOutfit.CASUAL);
  });
});

describe('ExpressionManager', () => {
  const manager = new ExpressionManager();

  it('is sleepy while sleeping', () => {
    const context = makeContext();
    expect(
      manager.resolve({ context, state: CompanionState.SLEEPING, mood: CompanionMood.LOW_ENERGY }).getValueOrThrow()
    ).toBe(Expression.SLEEPY);
  });

  it('is deterministic and always valid', () => {
    const context = makeContext();
    const first = manager.resolve({ context, state: CompanionState.IDLE, mood: CompanionMood.HAPPY }).getValueOrThrow();
    const second = manager.resolve({ context, state: CompanionState.IDLE, mood: CompanionMood.HAPPY }).getValueOrThrow();
    expect(first).toBe(second);
    expect(Object.values(Expression)).toContain(first);
  });
});

describe('GestureManager', () => {
  const manager = new GestureManager();

  it('cooks while cooking and walks while walking', () => {
    const context = makeContext();
    expect(
      manager.resolve({ context, state: CompanionState.COOKING, location: CompanionLocation.KITCHEN }).getValueOrThrow()
    ).toBe(Gesture.COOK);
    expect(
      manager.resolve({ context, state: CompanionState.WALKING, location: CompanionLocation.GARDEN }).getValueOrThrow()
    ).toBe(Gesture.WALK);
  });

  it('is deterministic', () => {
    const context = makeContext();
    expect(
      manager.resolve({ context, state: CompanionState.IDLE, location: CompanionLocation.BALCONY }).getValueOrThrow()
    ).toBe(manager.resolve({ context, state: CompanionState.IDLE, location: CompanionLocation.BALCONY }).getValueOrThrow());
  });
});

describe('AvailabilityManager', () => {
  const manager = new AvailabilityManager();

  it('is offline while sleeping', () => {
    const context = makeContext();
    expect(
      manager.resolve({ context, state: CompanionState.SLEEPING, mood: CompanionMood.LOW_ENERGY }).getValueOrThrow()
    ).toBe(Availability.OFFLINE);
  });

  it('is do-not-disturb while driving', () => {
    const context = makeContext();
    expect(
      manager.resolve({ context, state: CompanionState.DRIVING, mood: CompanionMood.FOCUSED }).getValueOrThrow()
    ).toBe(Availability.DO_NOT_DISTURB);
  });

  it('is available when idle and rested', () => {
    const context = makeContext();
    expect(
      manager.resolve({ context, state: CompanionState.IDLE, mood: CompanionMood.HAPPY }).getValueOrThrow()
    ).toBe(Availability.AVAILABLE);
  });

  it('respects an INACTIVE status override', () => {
    const context = makeContext({}, {}, { signals: { statusOverride: 'INACTIVE' } });
    expect(
      manager.resolve({ context, state: CompanionState.IDLE, mood: CompanionMood.HAPPY }).getValueOrThrow()
    ).toBe(Availability.OFFLINE);
  });
});
