import { WorldMode } from '../enums/world.enums';
import { WorldContext } from '../context/world-context';
import { DefaultWorldStrategy } from '../strategies/default-world.strategy';
import { FixedClock } from '../utils/clock.util';

function contextFor(companionId: string): WorldContext {
  const date = new Date('2026-07-07T10:00:00Z');
  return WorldContext.create(
    { companionId, referenceDate: date, timezone: 'UTC' },
    new FixedClock(date)
  );
}

describe('DefaultWorldStrategy (70-20-10)', () => {
  const strategy = new DefaultWorldStrategy();

  it('is deterministic for the same context', () => {
    const ctx = contextFor('companion-abc');
    expect(strategy.resolveMode(ctx)).toBe(strategy.resolveMode(ctx));
  });

  it('exposes a stable strategy name', () => {
    expect(strategy.name).toBe('default-70-20-10');
  });

  it('approximates the 70-20-10 distribution across many companions', () => {
    const counts: Record<WorldMode, number> = {
      [WorldMode.HOME]: 0,
      [WorldMode.DAILY_LIFE]: 0,
      [WorldMode.SPECIAL_MOMENT]: 0,
    };

    const sample = 8000;
    for (let i = 0; i < sample; i++) {
      const mode = strategy.resolveMode(contextFor(`companion-${i}`));
      counts[mode]++;
    }

    const home = counts[WorldMode.HOME] / sample;
    const daily = counts[WorldMode.DAILY_LIFE] / sample;
    const special = counts[WorldMode.SPECIAL_MOMENT] / sample;

    // Allow a few percent of sampling noise around the target ratios.
    expect(home).toBeGreaterThan(0.65);
    expect(home).toBeLessThan(0.75);
    expect(daily).toBeGreaterThan(0.15);
    expect(daily).toBeLessThan(0.25);
    expect(special).toBeGreaterThan(0.06);
    expect(special).toBeLessThan(0.14);
  });
});
