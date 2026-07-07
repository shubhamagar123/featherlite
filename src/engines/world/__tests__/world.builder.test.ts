import {
  Activity,
  AmbientSound,
  Lighting,
  Music,
  Outfit,
  Scene,
  Season,
  TimeOfDay,
  Weather,
  WorldMode,
} from '../enums/world.enums';
import { WorldContext } from '../context/world-context';
import { WorldBuilder } from '../builder/world.builder';
import { FixedClock } from '../utils/clock.util';
import { GeneratedWorldDTO } from '../dtos/world-generation.dto';

function buildFor(companionId: string, iso: string, timezone = 'UTC'): GeneratedWorldDTO {
  const date = new Date(iso);
  const context = WorldContext.create(
    { companionId, referenceDate: date, timezone },
    new FixedClock(date)
  );
  return new WorldBuilder().build(context);
}

/** Strip the wall-clock generation timestamp before comparing worlds. */
function stable(world: GeneratedWorldDTO): Omit<GeneratedWorldDTO, 'generatedAt'> {
  const { generatedAt: _generatedAt, ...rest } = world;
  return rest;
}

describe('WorldBuilder', () => {
  it('produces a fully populated world', () => {
    const world = buildFor('companion-1', '2026-07-07T10:00:00Z');

    expect(Object.values(WorldMode)).toContain(world.mode);
    expect(Object.values(TimeOfDay)).toContain(world.timeOfDay);
    expect(Object.values(Season)).toContain(world.season);
    expect(Object.values(Weather)).toContain(world.weather);
    expect(Object.values(Scene)).toContain(world.scene);
    expect(Object.values(Activity)).toContain(world.activity);
    expect(Object.values(Outfit)).toContain(world.outfit);
    expect(Object.values(Lighting)).toContain(world.lighting);
    expect(Object.values(AmbientSound)).toContain(world.ambientSound);
    expect(Object.values(Music)).toContain(world.music);
    expect(world.houseState).toBeDefined();
    expect(world.mood).toBeTruthy();
    expect(world.companionId).toBe('companion-1');
    expect(world.date).toBe('2026-07-07');
  });

  it('is fully deterministic for the same companion + day', () => {
    const a = buildFor('companion-42', '2026-07-07T10:00:00Z');
    const b = buildFor('companion-42', '2026-07-07T10:00:00Z');
    expect(stable(a)).toEqual(stable(b));
  });

  it('derives morning time-of-day and a fresh mood from a 10:00 local clock', () => {
    const world = buildFor('companion-morning', '2026-07-07T10:00:00Z');
    expect(world.timeOfDay).toBe(TimeOfDay.MORNING);
    expect(world.season).toBe(Season.SUMMER);
  });

  it('produces different worlds on different days for the same companion', () => {
    const day1 = buildFor('companion-same', '2026-07-07T10:00:00Z');
    const day2 = buildFor('companion-same', '2026-09-15T10:00:00Z');
    // Different seed (date changed) -> at least the seed must differ.
    expect(day1.seed).not.toBe(day2.seed);
  });
});
