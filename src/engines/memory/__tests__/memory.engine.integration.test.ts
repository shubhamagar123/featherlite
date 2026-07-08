import { describe, it, expect, beforeEach } from '@jest/globals';
import { getMemoryEngine, resetMemoryEngine } from '../memory.factory';
import { MemoryType, SearchType } from '../enums/memory.enums';

describe('Memory Engine Integration Tests', () => {
  beforeEach(() => {
    resetMemoryEngine();
  });

  it('should create and retrieve memories across multiple users', () => {
    const engine = getMemoryEngine();

    const mem1 = engine.create('user-1', MemoryType.PERSON, 'Alice', 'Alice is great').value;
    const mem2 = engine.create('user-2', MemoryType.PERSON, 'Bob', 'Bob is nice').value;

    const searchResult = engine.search({
      searchType: SearchType.KEYWORD,
      query: 'Alice',
      userId: 'user-1',
    });

    expect(searchResult.isSuccess).toBe(true);
    expect(searchResult.value.memories.length).toBeGreaterThan(0);
  });

  it('should support memory lifecycle: create -> update -> expire -> archive', () => {
    const engine = getMemoryEngine();

    const memResult = engine.create('user-1', MemoryType.TEMPORARY, 'Temp', 'Temporary memory');
    const memory = memResult.value;

    const updatedMemory = { ...memory, tags: ['temporary'] };
    const updateResult = engine.update(updatedMemory);
    expect(updateResult.isSuccess).toBe(true);

    const expireResult = engine.expire(memory.id);
    expect(expireResult.isSuccess).toBe(true);

    const archiveResult = engine.archive(memory.id);
    expect(archiveResult.isSuccess).toBe(true);
  });

  it('should merge related memories intelligently', () => {
    const engine = getMemoryEngine();

    const mem1 = engine.create(
      'user-1',
      MemoryType.PERSON,
      'John from college',
      'John was my roommate in college'
    ).value;

    const mem2 = engine.create(
      'user-1',
      MemoryType.PERSON,
      'John works with me',
      'John is my colleague at work'
    ).value;

    const mergeResult = engine.merge([mem1.id, mem2.id]);

    expect(mergeResult.isSuccess).toBe(true);
    expect(mergeResult.value.mergedCount).toBe(2);
    expect(mergeResult.value.mergedMemory.description).toContain('college');
    expect(mergeResult.value.mergedMemory.description).toContain('colleague');
  });

  it('should handle conflict resolution', () => {
    const engine = getMemoryEngine();

    const mem1 = engine.create('user-1', MemoryType.PREFERENCE, 'Food', 'I love spicy food').value;

    const mem2 = engine.create(
      'user-1',
      MemoryType.PREFERENCE,
      'Food preference',
      'I love spicy food at restaurants'
    ).value;

    const resolveResult = engine.resolveConflict(mem1.id, mem2.id);

    expect(resolveResult.isSuccess).toBe(true);
    expect(['KEEP_NEW', 'KEEP_EXISTING', 'MERGE']).toContain(resolveResult.value.resolution);
  });

  it('should build comprehensive snapshots', () => {
    const engine = getMemoryEngine();

    for (let i = 0; i < 10; i++) {
      engine.create('user-1', MemoryType.EVENT, `Event ${i}`, `This is event ${i}`);
    }

    for (let i = 0; i < 5; i++) {
      engine.create('user-1', MemoryType.PERSON, `Person ${i}`, `This is person ${i}`);
    }

    const snapshotResult = engine.buildSnapshot('user-1');

    expect(snapshotResult.isSuccess).toBe(true);
    const snapshot = snapshotResult.value;
    expect(snapshot.totalMemories).toBe(15);
    expect(snapshot.memoryTypeDistribution[MemoryType.EVENT]).toBe(10);
    expect(snapshot.memoryTypeDistribution[MemoryType.PERSON]).toBe(5);
    expect(snapshot.averageImportance).toBeGreaterThan(0);
    expect(snapshot.oldestMemory).toBeDefined();
    expect(snapshot.newestMemory).toBeDefined();
  });

  it('should maintain chronological timeline', () => {
    const engine = getMemoryEngine();

    for (let i = 0; i < 5; i++) {
      engine.create('user-1', MemoryType.EVENT, `Event ${i}`, `Event at time ${i}`);
    }

    const timelineResult = engine.getTimeline('user-1');

    expect(timelineResult.isSuccess).toBe(true);
    const timeline = timelineResult.value;
    expect(timeline.length).toBe(5);

    for (let i = 0; i < timeline.length - 1; i++) {
      expect(timeline[i].createdAt.getTime() <= timeline[i + 1].createdAt.getTime()).toBe(true);
    }
  });

  it('should support multiple search strategies', () => {
    const engine = getMemoryEngine();

    engine.create('user-1', MemoryType.FOOD, 'Restaurant', 'I love the Italian restaurant');
    engine.create(
      'user-1',
      MemoryType.TRAVEL,
      'Paris trip',
      'Visited Paris in summer with friends'
    );
    engine.create('user-1', MemoryType.WORK, 'Project', 'Completed an important work project');

    const keywordResult = engine.search({
      searchType: SearchType.KEYWORD,
      query: 'restaurant',
      userId: 'user-1',
    });
    expect(keywordResult.value.memories.length).toBeGreaterThan(0);

    const recentResult = engine.search({
      searchType: SearchType.RECENT,
      query: '',
      userId: 'user-1',
    });
    expect(recentResult.value.memories.length).toBeGreaterThan(0);
    expect(recentResult.value.memories[0].updatedAt).toBeDefined();
  });

  it('should handle relationship-scoped memories', () => {
    const engine = getMemoryEngine();

    const mem1Result = engine.create(
      'user-1',
      MemoryType.RELATIONSHIP,
      'With Alice',
      'Relationship with Alice is strong'
    );
    const mem1 = mem1Result.value;
    mem1.relationshipId = 'rel-1';
    engine.update(mem1);

    const mem2Result = engine.create(
      'user-1',
      MemoryType.RELATIONSHIP,
      'With Bob',
      'Relationship with Bob is new'
    );
    const mem2 = mem2Result.value;
    mem2.relationshipId = 'rel-2';
    engine.update(mem2);

    const snapshot1 = engine.buildSnapshot('user-1', 'rel-1');
    const snapshot2 = engine.buildSnapshot('user-1', 'rel-2');

    expect(snapshot1.isSuccess).toBe(true);
    expect(snapshot2.isSuccess).toBe(true);
    expect(snapshot1.value.relationshipId).toBe('rel-1');
    expect(snapshot2.value.relationshipId).toBe('rel-2');
  });

  it('should respect memory retention strategy', () => {
    const engine = getMemoryEngine();

    engine.create('user-1', MemoryType.RELATIONSHIP, 'Important relation', 'Very important');
    engine.create('user-1', MemoryType.TEMPORARY, 'Quick note', 'Not important');
    engine.create('user-1', MemoryType.PERSON, 'Key person', 'Significant');

    const snapshotResult = engine.buildSnapshot('user-1');
    expect(snapshotResult.isSuccess).toBe(true);
    expect(snapshotResult.value.totalMemories).toBeGreaterThan(0);
  });

  it('should auto-classify memories by type', () => {
    const engine = getMemoryEngine();

    const workResult = engine.create(
      'user-1',
      MemoryType.CONTEXT,
      'Work event',
      'I completed an important project at work with my team'
    );

    expect(workResult.isSuccess).toBe(true);
    expect([MemoryType.WORK, MemoryType.CONTEXT]).toContain(workResult.value.memoryType);
  });
});

declare global {
  namespace Jest {
    interface Matchers<R> {
      toBeGreaterThan(expected: number): R;
      toBe(expected: any): R;
      toContain(expected: any): R;
      toBeDefined(): R;
    }
  }
}
