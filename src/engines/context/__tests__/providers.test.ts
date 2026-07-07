import { Result } from '@services/types/result.type';
import { NotFoundError } from '@services/exceptions';

import { UserContextProvider } from '../providers/user-context.provider';
import { WorldContextProvider } from '../providers/world-context.provider';
import { CompanionContextProvider } from '../providers/companion-context.provider';
import { RelationshipContextProvider } from '../providers/relationship-context.provider';
import { MemoryContextProvider } from '../providers/memory-context.provider';
import { MomentsContextProvider } from '../providers/moments-context.provider';
import { ContextRequest } from '../dtos/conversation-context.dto';
import {
  makeWorld,
  mockCompanionEngine,
  mockMemoryService,
  mockMomentService,
  mockRelationshipEngine,
  mockUserService,
  mockWorldEngine,
} from './helpers';

const REQUEST: ContextRequest = { userId: 'user-1', companionId: 'companion-1' };

describe('UserContextProvider', () => {
  it('is required and maps the user DTO', async () => {
    const provider = new UserContextProvider(mockUserService());
    expect(provider.key).toBe('user');
    expect(provider.required).toBe(true);

    const result = await provider.provide(REQUEST);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toMatchObject({
      available: true,
      username: 'alice',
      displayName: 'Alice Wonder',
      role: 'USER',
    });
  });

  it('fails when the user is not found (required)', async () => {
    const provider = new UserContextProvider(
      mockUserService(Result.failure(new NotFoundError('User', 'user-1')))
    );
    const result = await provider.provide(REQUEST);
    expect(result.isSuccess).toBe(false);
  });
});

describe('WorldContextProvider', () => {
  it('maps the world from the World Engine', async () => {
    const provider = new WorldContextProvider(mockWorldEngine());
    const result = await provider.provide(REQUEST);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toMatchObject({ available: true, scene: 'LIVING_ROOM', weather: 'SUNNY' });
  });

  it('uses a supplied world without calling the engine', async () => {
    const engine = mockWorldEngine();
    const provider = new WorldContextProvider(engine);
    await provider.provide({ ...REQUEST, world: makeWorld({ mood: 'cozy' }) });
    expect(engine.getCurrentWorld).not.toHaveBeenCalled();
  });
});

describe('CompanionContextProvider', () => {
  it('maps the companion life-state snapshot', async () => {
    const provider = new CompanionContextProvider(mockCompanionEngine());
    const result = await provider.provide(REQUEST);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toMatchObject({
      available: true,
      name: 'Kai',
      state: 'RELAXING',
      availability: 'AVAILABLE',
    });
  });
});

describe('RelationshipContextProvider', () => {
  it('is optional and maps an existing relationship', async () => {
    const provider = new RelationshipContextProvider(mockRelationshipEngine());
    expect(provider.required).toBe(false);
    const result = await provider.provide(REQUEST);
    expect(result.value).toMatchObject({ available: true, level: 'FRIEND', affectionScore: 42 });
  });

  it('treats a missing relationship as a normal empty slice (not a failure)', async () => {
    const provider = new RelationshipContextProvider(
      mockRelationshipEngine(Result.failure(new NotFoundError('Relationship', 'x')))
    );
    const result = await provider.provide(REQUEST);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ available: false });
  });

  it('propagates a genuine error as a failure', async () => {
    const provider = new RelationshipContextProvider(
      mockRelationshipEngine(Result.failure(new Error('db down')))
    );
    const result = await provider.provide(REQUEST);
    expect(result.isSuccess).toBe(false);
  });
});

describe('MemoryContextProvider', () => {
  it('maps critical memories', async () => {
    const provider = new MemoryContextProvider(mockMemoryService());
    const result = await provider.provide(REQUEST);
    expect(result.value).toMatchObject({ available: true, count: 1 });
    expect(result.value!.items[0]).toMatchObject({ importance: 'HIGH', type: 'FACT' });
  });

  it('reports a known-empty slice when there are no memories', async () => {
    const provider = new MemoryContextProvider(mockMemoryService(Result.success([])));
    const result = await provider.provide(REQUEST);
    expect(result.value).toEqual({ available: true, count: 0, items: [] });
  });

  it('respects the memory limit', async () => {
    const service = mockMemoryService();
    const provider = new MemoryContextProvider(service);
    await provider.provide({ ...REQUEST, limits: { memories: 3 } });
    expect(service.getCriticalMemories).toHaveBeenCalledWith('companion-1', 3);
  });
});

describe('MomentsContextProvider', () => {
  it('maps recent moments', async () => {
    const provider = new MomentsContextProvider(mockMomentService());
    const result = await provider.provide(REQUEST);
    expect(result.value).toMatchObject({ available: true, count: 1 });
    expect(result.value!.items[0]).toMatchObject({ title: 'First long chat', significance: 0.8 });
  });
});
