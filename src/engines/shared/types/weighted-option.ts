/**
 * WeightedOption represents a candidate value paired with a relative selection weight.
 *
 * Used across engines for weighted deterministic selection (e.g., gesture selection,
 * outfit choices, scene transitions). Always paired with DeterministicRandom for
 * reproducible, seeded choices.
 */
export interface WeightedOption<T> {
  value: T;
  weight: number;
}
