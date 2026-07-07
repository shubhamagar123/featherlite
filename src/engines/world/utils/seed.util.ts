/**
 * Deterministic pseudo-randomness for the World Engine.
 *
 * The World Engine never calls `Math.random()`. Instead, every "choice" is
 * derived from a seed that is itself derived from stable identity + date. This
 * guarantees that the same companion on the same day always produces the same
 * world, while still allowing weighted distributions (like the 70-20-10 rule)
 * to hold when averaged over many days.
 *
 * Two primitives power this:
 *  - `fnv1a` — a fast, deterministic 32-bit string hash (FNV-1a).
 *  - `mulberry32` — a tiny, high-quality deterministic PRNG seeded by a number.
 */

/**
 * FNV-1a 32-bit hash. Pure and deterministic for a given input string.
 *
 * @param input - String to hash.
 * @returns Unsigned 32-bit integer hash.
 */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV prime multiply via Math.imul to stay in 32-bit space.
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * mulberry32 PRNG. Returns a generator function producing deterministic values
 * in the half-open interval [0, 1).
 *
 * @param seed - 32-bit unsigned integer seed.
 * @returns A function that yields the next deterministic value on each call.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A candidate value paired with a relative selection weight. */
export interface WeightedOption<T> {
  value: T;
  weight: number;
}

/**
 * DeterministicRandom is a seeded, reproducible source of choices.
 *
 * It exposes higher-level selection helpers (`pick`, `weightedPick`) on top of
 * the raw [0, 1) stream. Crucially, `salted()` forks an independent sub-stream
 * keyed by a label, so each selector can obtain its own reproducible stream
 * without its choices depending on how many values other selectors consumed.
 */
export class DeterministicRandom {
  private readonly generator: () => number;

  constructor(private readonly seed: number) {
    this.generator = mulberry32(seed >>> 0);
  }

  /**
   * Construct a DeterministicRandom from an arbitrary string key.
   *
   * @param key - String to derive the seed from.
   */
  static fromString(key: string): DeterministicRandom {
    return new DeterministicRandom(fnv1a(key));
  }

  /** The numeric seed backing this stream (useful for debugging / snapshots). */
  get seedValue(): number {
    return this.seed;
  }

  /** Next deterministic value in [0, 1). */
  next(): number {
    return this.generator();
  }

  /**
   * Next deterministic integer in [0, maxExclusive).
   *
   * @param maxExclusive - Exclusive upper bound (must be > 0).
   */
  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) {
      throw new RangeError('maxExclusive must be greater than 0');
    }
    return Math.floor(this.next() * maxExclusive);
  }

  /**
   * Deterministically pick one element from a non-empty list (uniform).
   *
   * @param items - Non-empty list of candidates.
   */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError('Cannot pick from an empty list');
    }
    return items[this.nextInt(items.length)]!;
  }

  /**
   * Deterministically pick one element using relative weights.
   *
   * Options with non-positive weight are ignored. If every option is filtered
   * out, the last provided option is returned as a safe fallback.
   *
   * @param options - Weighted candidates.
   */
  weightedPick<T>(options: readonly WeightedOption<T>[]): T {
    if (options.length === 0) {
      throw new RangeError('Cannot pick from an empty weighted list');
    }

    const valid = options.filter((o) => o.weight > 0);
    if (valid.length === 0) {
      return options[options.length - 1]!.value;
    }

    const total = valid.reduce((sum, o) => sum + o.weight, 0);
    let threshold = this.next() * total;

    for (const option of valid) {
      threshold -= option.weight;
      if (threshold < 0) {
        return option.value;
      }
    }

    return valid[valid.length - 1]!.value;
  }

  /**
   * Fork an independent, reproducible sub-stream keyed by a label.
   *
   * Combining the label with the current seed means two different labels yield
   * unrelated streams, while the same label + seed always yields the same one.
   *
   * @param salt - Label identifying the sub-stream (e.g. a selector name).
   */
  salted(salt: string): DeterministicRandom {
    return DeterministicRandom.fromString(`${salt}:${this.seed}`);
  }
}
