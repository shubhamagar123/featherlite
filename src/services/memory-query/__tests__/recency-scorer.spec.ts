import { RecencyScorer } from '../scorers/recency-scorer';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { MemoryType } from '../../../engines/memory/enums/memory.enums';

describe('RecencyScorer', () => {
  let scorer: RecencyScorer;
  let now: Date;

  beforeEach(() => {
    scorer = new RecencyScorer();
    now = new Date();
  });

  it('should score memory from today as 100', () => {
    const memory: Memory = {
      id: '1',
      userId: 'user1',
      memoryType: MemoryType.FACT,
      content: 'Test',
      importance: 0.5,
      confidence: 0.5,
      tags: [],
      entities: [],
      createdAt: now,
      updatedAt: now,
      expiryAt: undefined,
      relationshipId: 'rel1',
      sourceEventType: 'CONVERSATION',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
      metadata: {},
    };

    const result = scorer.score([memory], {});

    expect(result.isSuccess).toBe(true);
    expect(result.value.get(memory.id)).toBe(100);
  });

  it('should score memory from 1 day ago as 90', () => {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const memory: Memory = {
      id: '1',
      userId: 'user1',
      memoryType: MemoryType.FACT,
      content: 'Test',
      importance: 0.5,
      confidence: 0.5,
      tags: [],
      entities: [],
      createdAt: yesterday,
      updatedAt: yesterday,
      expiryAt: undefined,
      relationshipId: 'rel1',
      sourceEventType: 'CONVERSATION',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
      metadata: {},
    };

    const result = scorer.score([memory], {});

    expect(result.isSuccess).toBe(true);
    expect(result.value.get(memory.id)).toBe(90);
  });

  it('should decay scores based on age', () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const memory: Memory = {
      id: '1',
      userId: 'user1',
      memoryType: MemoryType.FACT,
      content: 'Test',
      importance: 0.5,
      confidence: 0.5,
      tags: [],
      entities: [],
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
      expiryAt: undefined,
      relationshipId: 'rel1',
      sourceEventType: 'CONVERSATION',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
      metadata: {},
    };

    const result = scorer.score([memory], {});

    expect(result.isSuccess).toBe(true);
    const score = result.value.get(memory.id)!;
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(0);
  });

  it('should return minimal score for very old memories', () => {
    const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
    const memory: Memory = {
      id: '1',
      userId: 'user1',
      memoryType: MemoryType.FACT,
      content: 'Test',
      importance: 0.5,
      confidence: 0.5,
      tags: [],
      entities: [],
      createdAt: twoYearsAgo,
      updatedAt: twoYearsAgo,
      expiryAt: undefined,
      relationshipId: 'rel1',
      sourceEventType: 'CONVERSATION',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
      metadata: {},
    };

    const result = scorer.score([memory], {});

    expect(result.isSuccess).toBe(true);
    const score = result.value.get(memory.id)!;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(20);
  });

  it('should score all memories', () => {
    const memories: Memory[] = [
      {
        id: '1',
        userId: 'user1',
        memoryType: MemoryType.FACT,
        content: 'Test 1',
        importance: 0.5,
        confidence: 0.5,
        tags: [],
        entities: [],
        createdAt: now,
        updatedAt: now,
        expiryAt: undefined,
        relationshipId: 'rel1',
        sourceEventType: 'CONVERSATION',
        visibility: 'PRIVATE',
        status: 'ACTIVE',
        metadata: {},
      },
      {
        id: '2',
        userId: 'user1',
        memoryType: MemoryType.FACT,
        content: 'Test 2',
        importance: 0.5,
        confidence: 0.5,
        tags: [],
        entities: [],
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        expiryAt: undefined,
        relationshipId: 'rel1',
        sourceEventType: 'CONVERSATION',
        visibility: 'PRIVATE',
        status: 'ACTIVE',
        metadata: {},
      },
    ];

    const result = scorer.score(memories, {});

    expect(result.isSuccess).toBe(true);
    expect(result.value.size).toBe(2);
  });
});
