import { MemoryFilter } from '../components/memory-filter';
import { FilterType } from '../enums/memory-query.enums';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { MemoryType, MemoryStatus } from '../../../engines/memory/enums/memory.enums';

describe('MemoryFilter', () => {
  let filter: MemoryFilter;
  let mockMemories: Memory[];

  beforeEach(() => {
    filter = new MemoryFilter();
    mockMemories = [
      {
        id: '1',
        userId: 'user1',
        memoryType: MemoryType.FACT,
        content: 'Alice likes pizza',
        importance: 0.8,
        confidence: 0.9,
        tags: ['food', 'preference'],
        entities: [{ name: 'Alice', type: 'PERSON' }],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-08'),
        expiryAt: undefined,
        relationshipId: 'rel1',
        sourceEventType: 'CONVERSATION',
        visibility: 'PRIVATE',
        status: MemoryStatus.ACTIVE,
        metadata: {},
      },
      {
        id: '2',
        userId: 'user1',
        memoryType: MemoryType.PREFERENCE,
        content: 'Bob likes coding',
        importance: 0.6,
        confidence: 0.7,
        tags: ['hobby'],
        entities: [{ name: 'Bob', type: 'PERSON' }],
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
        expiryAt: undefined,
        relationshipId: 'rel2',
        sourceEventType: 'CONVERSATION',
        visibility: 'PUBLIC',
        status: MemoryStatus.ACTIVE,
        metadata: {},
      },
      {
        id: '3',
        userId: 'user1',
        memoryType: MemoryType.FACT,
        content: 'Charlie lives in NYC',
        importance: 0.5,
        confidence: 0.8,
        tags: [],
        entities: [{ name: 'Charlie', type: 'PERSON' }],
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-01'),
        expiryAt: undefined,
        relationshipId: 'rel1',
        sourceEventType: 'CONVERSATION',
        visibility: 'PRIVATE',
        status: MemoryStatus.ARCHIVED,
        metadata: {},
      },
    ];
  });

  it('should filter by memory type', () => {
    const result = filter.apply(mockMemories, [
      { type: FilterType.MEMORY_TYPE, value: MemoryType.FACT },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(2);
    expect(result.value.every((m) => m.memoryType === MemoryType.FACT)).toBe(true);
  });

  it('should filter by date range', () => {
    const result = filter.apply(mockMemories, [
      {
        type: FilterType.DATE_RANGE,
        value: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        },
      },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(1);
    expect(result.value[0].id).toBe('1');
  });

  it('should filter by importance with gte operator', () => {
    const result = filter.apply(mockMemories, [
      {
        type: FilterType.IMPORTANCE,
        value: 0.7,
        operator: 'gte',
      },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(1);
    expect(result.value[0].id).toBe('1');
  });

  it('should filter by confidence with lt operator', () => {
    const result = filter.apply(mockMemories, [
      {
        type: FilterType.CONFIDENCE,
        value: 0.75,
        operator: 'lt',
      },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(1);
    expect(result.value?.[0]?.id).toBe('2');
  });

  it('should filter by expiry status', () => {
    const result = filter.apply(mockMemories, [
      { type: FilterType.EXPIRY_STATUS, value: 'active' },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(2);
  });

  it('should filter by relationship', () => {
    const result = filter.apply(mockMemories, [
      { type: FilterType.RELATIONSHIP, value: 'rel1' },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(2);
  });

  it('should filter by tag', () => {
    const result = filter.apply(mockMemories, [
      { type: FilterType.TAG, value: 'preference' },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(1);
    expect(result.value[0].id).toBe('1');
  });

  it('should filter by entity', () => {
    const result = filter.apply(mockMemories, [
      { type: FilterType.ENTITY, value: 'alice' },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(1);
    expect(result.value[0].id).toBe('1');
  });

  it('should filter by visibility', () => {
    const result = filter.apply(mockMemories, [
      { type: FilterType.VISIBILITY, value: 'PUBLIC' },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(1);
    expect(result.value[0].id).toBe('2');
  });

  it('should filter archived memories', () => {
    const result = filter.apply(mockMemories, [
      { type: FilterType.ARCHIVED, value: true },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(1);
    expect(result.value[0].id).toBe('3');
  });

  it('should apply multiple filters', () => {
    // FACT + rel1 matches Alice (active) and Charlie (archived). The filter
    // combines conjunctively — both match, so expect two results in id order.
    const result = filter.apply(mockMemories, [
      { type: FilterType.MEMORY_TYPE, value: MemoryType.FACT },
      { type: FilterType.RELATIONSHIP, value: 'rel1' },
    ]);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(2);
    const ids = (result.value ?? []).map((m) => m.id).sort();
    expect(ids).toEqual(['1', '3']);
  });

  it('should return all memories when no filters are provided', () => {
    const result = filter.apply(mockMemories, []);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(3);
  });
});
