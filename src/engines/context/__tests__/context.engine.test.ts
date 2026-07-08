import { Result } from '@services/types/result.type';
import { FixedClock } from '@engines/world';

import { ContextBuilder } from '../builder/context.builder';
import { ContextEngine } from '../context.engine';
import { buildProviderSet } from '../context.factory';
import { ContextRequest } from '../dtos/conversation-context.dto';
import {
  makeWorld,
  mockCompanionEngine,
  mockMomentService,
  mockRelationshipEngine,
  mockUserService,
  mockWorldEngine,
  mockMemoryEngine,
  TEST_DATE,
} from './helpers';
import type { ServiceContainer } from '@services/factory';
import type { IRelationshipEngine } from '@engines/relationship';
import type { IMemoryEngine } from '@engines/memory';

interface EngineOverrides {
  serviceOverrides?: Partial<ServiceContainer>;
  relationshipEngine?: IRelationshipEngine;
  memoryEngine?: IMemoryEngine;
}

function buildEngine(overrides: EngineOverrides = {}) {
  const services = {
    userService: mockUserService(),
    momentService: mockMomentService(),
    ...overrides.serviceOverrides,
  } as unknown as ServiceContainer;

  const worldEngine = mockWorldEngine();
  const companionEngine = mockCompanionEngine();
  const relEngine = overrides.relationshipEngine ?? mockRelationshipEngine();
  const memEngine = overrides.memoryEngine ?? mockMemoryEngine();

  const providers = buildProviderSet(
    services,
    worldEngine,
    companionEngine,
    relEngine,
    memEngine
  );
  const builder = new ContextBuilder(providers, new FixedClock(TEST_DATE));
  return { engine: new ContextEngine(builder), worldEngine, companionEngine };
}

const REQUEST: ContextRequest = {
  userId: 'user-1',
  companionId: 'companion-1',
  referenceDate: TEST_DATE,
  timezone: 'UTC',
};

describe('ContextEngine (integration with real providers, mocked sources)', () => {
  it('assembles a full ConversationContext from every source', async () => {
    const { engine } = buildEngine();
    const result = await engine.assembleContext(REQUEST);

    expect(result.isSuccess).toBe(true);
    const ctx = result.value!;
    expect(ctx.user).toMatchObject({ available: true, username: 'alice' });
    expect(ctx.companion).toMatchObject({ available: true, name: 'Kai' });
    expect(ctx.world).toMatchObject({ available: true, scene: 'LIVING_ROOM' });
    expect(ctx.relationship).toMatchObject({ available: true, level: 'FRIEND' });
    expect(ctx.memories).toMatchObject({ available: true, count: 1 });
    expect(ctx.moments).toMatchObject({ available: true, count: 1 });
    expect(ctx.meta.degraded).toEqual([]);
  });

  it('exposes the six provider keys', () => {
    const { engine } = buildEngine();
    expect(engine.providerKeys().sort()).toEqual(
      ['companion', 'memory', 'moments', 'relationship', 'user', 'world'].sort()
    );
  });

  it('threads a supplied world so the world provider does not re-fetch', async () => {
    const { engine, worldEngine } = buildEngine();
    await engine.assembleContext({ ...REQUEST, world: makeWorld() });
    expect(worldEngine.getCurrentWorld).not.toHaveBeenCalled();
  });

  it('aborts when the required user source is missing', async () => {
    const { engine } = buildEngine({
      serviceOverrides: {
        userService: mockUserService(Result.failure(new Error('no user'))),
      },
    });
    const result = await engine.assembleContext(REQUEST);
    expect(result.isSuccess).toBe(false);
  });

  it('degrades when the optional moments source errors', async () => {
    const { engine } = buildEngine({
      serviceOverrides: {
        momentService: mockMomentService(Result.failure(new Error('moments down'))),
      },
    });
    const result = await engine.assembleContext(REQUEST);
    expect(result.isSuccess).toBe(true);
    expect(result.value!.meta.degraded).toContain('moments');
    expect(result.value!.moments).toEqual({ available: false, count: 0, items: [] });
  });
});
