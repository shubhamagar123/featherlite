import { Result, type IResult } from '@services/types/result.type';
import { FixedClock } from '@engines/world';

import { ContextBuilder } from '../builder/context.builder';
import { ContextProviderSet } from '../interfaces/context-builder.interface';
import { IContextProvider, ContextProviderKey } from '../interfaces/context-provider.interface';
import { ContextRequest } from '../dtos/conversation-context.dto';
import { TEST_DATE } from './helpers';

/** Minimal configurable fake provider. */
function fakeProvider<T>(
  key: ContextProviderKey,
  required: boolean,
  value: T,
  empty: T,
  behavior: { result?: IResult<T>; throws?: boolean } = {}
): IContextProvider<T> {
  return {
    key,
    required,
    emptySlice: () => empty,
    provide: jest.fn(async () => {
      if (behavior.throws) throw new Error(`${key} threw`);
      return behavior.result ?? Result.success(value);
    }),
  };
}

function makeSet(
  overrides: Partial<{
    user: IContextProvider<any>;
    companion: IContextProvider<any>;
    world: IContextProvider<any>;
    relationship: IContextProvider<any>;
    memory: IContextProvider<any>;
    moments: IContextProvider<any>;
  }> = {}
): ContextProviderSet {
  return {
    user: overrides.user ?? fakeProvider('user', true, { available: true, id: 'user-1' }, { available: false }),
    companion:
      overrides.companion ??
      fakeProvider('companion', true, { available: true, name: 'Kai' }, { available: false }),
    world: overrides.world ?? fakeProvider('world', true, { available: true }, { available: false }),
    relationship:
      overrides.relationship ??
      fakeProvider('relationship', false, { available: true, daysSinceFirstInteraction: 30 }, { available: false }),
    memory:
      overrides.memory ??
      fakeProvider('memory', false, { available: true, count: 1, items: [{}] }, { available: false, count: 0, items: [] }),
    moments:
      overrides.moments ??
      fakeProvider('moments', false, { available: true, count: 0, items: [] }, { available: false, count: 0, items: [] }),
  } as ContextProviderSet;
}

const REQUEST: ContextRequest = {
  userId: 'user-1',
  companionId: 'companion-1',
  referenceDate: TEST_DATE,
  timezone: 'UTC',
};

describe('ContextBuilder', () => {
  it('assembles a complete context from all providers', async () => {
    const builder = new ContextBuilder(makeSet(), new FixedClock(TEST_DATE));
    const result = await builder.build(REQUEST);

    expect(result.isSuccess).toBe(true);
    const ctx = result.value!;
    expect(ctx.userId).toBe('user-1');
    expect(ctx.companionId).toBe('companion-1');
    expect(ctx.requestId).toContain('ctx_user-1_companion-1_');
    expect(ctx.user.available).toBe(true);
    expect(ctx.companion.name).toBe('Kai');
    expect(ctx.relationship.available).toBe(true);
    expect(ctx.meta.degraded).toEqual([]);
    expect(ctx.meta.providers).toHaveLength(6);
    expect(ctx.meta.timezone).toBe('UTC');
    expect(typeof ctx.meta.buildDurationMs).toBe('number');
  });

  it('aborts when a REQUIRED provider fails', async () => {
    const set = makeSet({
      world: fakeProvider('world', true, { available: true }, { available: false }, {
        result: Result.failure(new Error('world down')),
      }),
    });
    const builder = new ContextBuilder(set, new FixedClock(TEST_DATE));
    const result = await builder.build(REQUEST);
    expect(result.isSuccess).toBe(false);
  });

  it('degrades gracefully when an OPTIONAL provider fails', async () => {
    const set = makeSet({
      memory: fakeProvider(
        'memory',
        false,
        { available: true, count: 1, items: [{}] },
        { available: false, count: 0, items: [] },
        { result: Result.failure(new Error('memory down')) }
      ),
    });
    const builder = new ContextBuilder(set, new FixedClock(TEST_DATE));
    const result = await builder.build(REQUEST);

    expect(result.isSuccess).toBe(true);
    const ctx = result.value!;
    expect(ctx.memories).toEqual({ available: false, count: 0, items: [] });
    expect(ctx.meta.degraded).toContain('memory');
    const memReport = ctx.meta.providers.find((p) => p.key === 'memory');
    expect(memReport).toMatchObject({ ok: false, degraded: true });
  });

  it('captures a thrown optional provider as degradation, not a crash', async () => {
    const set = makeSet({
      moments: fakeProvider(
        'moments',
        false,
        { available: true, count: 0, items: [] },
        { available: false, count: 0, items: [] },
        { throws: true }
      ),
    });
    const builder = new ContextBuilder(set, new FixedClock(TEST_DATE));
    const result = await builder.build(REQUEST);
    expect(result.isSuccess).toBe(true);
    expect(result.value!.meta.degraded).toContain('moments');
  });

  it('aborts when a REQUIRED provider throws', async () => {
    const set = makeSet({
      user: fakeProvider('user', true, { available: true }, { available: false }, { throws: true }),
    });
    const builder = new ContextBuilder(set, new FixedClock(TEST_DATE));
    const result = await builder.build(REQUEST);
    expect(result.isSuccess).toBe(false);
  });
});
