import { DeterministicRandom, fnv1a, mulberry32 } from '../utils/seed.util';

describe('seed.util', () => {
  describe('fnv1a', () => {
    it('is deterministic for the same input', () => {
      expect(fnv1a('featherlight')).toBe(fnv1a('featherlight'));
    });

    it('produces different hashes for different inputs', () => {
      expect(fnv1a('kai')).not.toBe(fnv1a('kia'));
    });

    it('returns an unsigned 32-bit integer', () => {
      const hash = fnv1a('some-companion-id:2026-07-07');
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    });
  });

  describe('mulberry32', () => {
    it('produces a reproducible sequence for the same seed', () => {
      const a = mulberry32(12345);
      const b = mulberry32(12345);
      expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    });

    it('yields values in [0, 1)', () => {
      const gen = mulberry32(999);
      for (let i = 0; i < 1000; i++) {
        const v = gen();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe('DeterministicRandom', () => {
    it('reproduces the same stream from the same seed', () => {
      const a = new DeterministicRandom(42);
      const b = new DeterministicRandom(42);
      expect(a.next()).toBe(b.next());
    });

    it('salted sub-streams are independent yet reproducible', () => {
      const base = DeterministicRandom.fromString('base-seed');
      const scene1 = base.salted('scene').next();
      const scene2 = DeterministicRandom.fromString('base-seed').salted('scene').next();
      const weather = base.salted('weather').next();

      expect(scene1).toBe(scene2); // reproducible
      expect(scene1).not.toBe(weather); // independent
    });

    it('pick throws on empty list', () => {
      expect(() => new DeterministicRandom(1).pick([])).toThrow(RangeError);
    });

    it('weightedPick respects weights over a large sample', () => {
      const counts = { A: 0, B: 0 };
      // Draw from many independent seeds to sample the distribution.
      for (let i = 0; i < 5000; i++) {
        const rng = DeterministicRandom.fromString(`sample:${i}`);
        const choice = rng.weightedPick([
          { value: 'A' as const, weight: 90 },
          { value: 'B' as const, weight: 10 },
        ]);
        counts[choice]++;
      }
      // A should dominate roughly 9:1; allow generous tolerance.
      expect(counts.A).toBeGreaterThan(counts.B * 4);
    });

    it('weightedPick ignores non-positive weights', () => {
      const rng = DeterministicRandom.fromString('x');
      const choice = rng.weightedPick([
        { value: 'zero', weight: 0 },
        { value: 'only', weight: 5 },
      ]);
      expect(choice).toBe('only');
    });

    it('weightedPick falls back to last option when all weights are zero', () => {
      const rng = DeterministicRandom.fromString('x');
      const choice = rng.weightedPick([
        { value: 'a', weight: 0 },
        { value: 'b', weight: 0 },
      ]);
      expect(choice).toBe('b');
    });
  });
});
