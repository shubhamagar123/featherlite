/**
 * Clock abstraction.
 *
 * The World Engine is time-sensitive (time of day, day boundaries). Injecting a
 * Clock instead of calling `new Date()` directly makes every time-dependent
 * behaviour deterministic and unit-testable.
 */
export interface Clock {
  /** Returns the current instant. */
  now(): Date;
}

/** Default Clock backed by the system time. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/**
 * Fixed Clock that always returns the same instant. Intended for tests and for
 * reproducible "generate the world as of instant X" flows.
 */
export class FixedClock implements Clock {
  constructor(private readonly instant: Date) {}

  now(): Date {
    return new Date(this.instant.getTime());
  }
}
