import { describe, it, expect, beforeEach } from '@jest/globals';
import { MemoryEngine } from '../memory.engine';
import { MemoryRepository } from '../repositories/memory.repository';
import { EntityExtractor } from '../components/entity-extractor';
import { MemoryClassifier } from '../components/memory-classifier';
import { ImportanceEvaluator } from '../components/importance-evaluator';
import { ExpiryEvaluator } from '../components/expiry-evaluator';
import { ConflictResolver } from '../components/conflict-resolver';
import { MemoryMerger } from '../components/memory-merger';
import { MemoryIndexer } from '../components/memory-indexer';
import { MemorySearcher } from '../components/memory-searcher';
import { MemoryRankingStrategy } from '../strategies/memory-ranking.strategy';
import { MemoryRetentionStrategy } from '../strategies/memory-retention.strategy';
import { MemoryTimeline } from '../components/memory-timeline';
import { MemorySnapshotBuilder } from '../components/memory-snapshot-builder';
import { MemoryType, MemoryStatus, SearchType } from '../enums/memory.enums';

describe('MemoryEngine', () => {
  let memoryEngine: MemoryEngine;
  let repository: MemoryRepository;

  beforeEach(() => {
    repository = new MemoryRepository();
    const entityExtractor = new EntityExtractor();
    const classifier = new MemoryClassifier();
    const importanceEvaluator = new ImportanceEvaluator();
    const expiryEvaluator = new ExpiryEvaluator();
    const conflictResolver = new ConflictResolver();
    const merger = new MemoryMerger();
    const indexer = new MemoryIndexer();
    const timeline = new MemoryTimeline();
    const searcher = new MemorySearcher(indexer, repository);
    const rankingStrategy = new MemoryRankingStrategy();
    const retentionStrategy = new MemoryRetentionStrategy();
    const snapshotBuilder = new MemorySnapshotBuilder(repository);

    memoryEngine = new MemoryEngine(
      repository,
      entityExtractor,
      classifier,
      importanceEvaluator,
      expiryEvaluator,
      conflictResolver,
      merger,
      indexer,
      timeline,
      searcher,
      rankingStrategy,
      retentionStrategy,
      snapshotBuilder
    );
  });

  describe('create', () => {
    it('should create a new memory with auto-classification', () => {
      const result = memoryEngine.create(
        'user-1',
        MemoryType.CONTEXT,
        'John is my friend',
        'John is my best friend. We love spending time together.'
      );

      expect(result.isSuccess).toBe(true);
      const memory = result.value;
      expect(memory.userId).toBe('user-1');
      expect(memory.title).toBe('John is my friend');
      expect(memory.status).toBe(MemoryStatus.ACTIVE);
      expect(memory.entities.length).toBeGreaterThan(0);
    });

    it('should extract entities from description', () => {
      const result = memoryEngine.create(
        'user-1',
        MemoryType.CONTEXT,
        'Trip to Paris',
        'I visited Paris last summer with my friend Alice'
      );

      expect(result.isSuccess).toBe(true);
      const memory = result.value;
      expect(memory.entities.length).toBeGreaterThan(0);
      const names = memory.entities.map((e) => e.name.toLowerCase());
      expect(names.some((n) => n.includes('paris') || n.includes('alice'))).toBe(
        true
      );
    });

    it('should calculate importance score', () => {
      const result = memoryEngine.create(
        'user-1',
        MemoryType.LONG_TERM,
        'Important goal',
        'I love my dream to become a professional musician and perform on stage'
      );

      expect(result.isSuccess).toBe(true);
      const memory = result.value;
      expect(memory.importance).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('should update existing memory', () => {
      const createResult = memoryEngine.create(
        'user-1',
        MemoryType.CONTEXT,
        'Original title',
        'Original description'
      );

      const created = createResult.value;
      created.title = 'Updated title';
      created.tags = ['important', 'work'];

      const updateResult = memoryEngine.update(created);

      expect(updateResult.isSuccess).toBe(true);
      const updated = updateResult.value;
      expect(updated.title).toBe('Updated title');
      expect(updated.tags).toContain('important');
    });

    it('should fail when updating non-existent memory', () => {
      const fakeMemory = {
        id: 'non-existent',
        userId: 'user-1',
        memoryType: MemoryType.CONTEXT,
        title: 'Fake',
        description: 'Fake',
        entities: [],
        confidence: 0.5,
        importance: 0.5,
        status: MemoryStatus.ACTIVE,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: 'PRIVATE' as const,
      };

      const result = memoryEngine.update(fakeMemory);
      expect(result.isSuccess).toBe(false);
    });
  });

  describe('merge', () => {
    it('should merge multiple memories', () => {
      const result1 = memoryEngine.create(
        'user-1',
        MemoryType.PERSON,
        'Alice - friend',
        'Alice is my close friend from university'
      );
      const result2 = memoryEngine.create(
        'user-1',
        MemoryType.PERSON,
        'Alice - coworker',
        'Alice is my colleague at work'
      );

      const mergeResult = memoryEngine.merge([result1.value.id, result2.value.id]);

      expect(mergeResult.isSuccess).toBe(true);
      expect(mergeResult.value.mergedCount).toBe(2);
      expect(mergeResult.value.mergedMemory.description).toContain('university');
      expect(mergeResult.value.mergedMemory.description).toContain('colleague');
    });

    it('should fail merging with non-existent memory', () => {
      const result = memoryEngine.create(
        'user-1',
        MemoryType.CONTEXT,
        'Test',
        'Test memory'
      );

      const mergeResult = memoryEngine.merge([result.value.id, 'non-existent-id']);
      expect(mergeResult.isSuccess).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      memoryEngine.create(
        'user-1',
        MemoryType.FOOD,
        'Favorite restaurant',
        'I love the Italian restaurant downtown with amazing pasta'
      );

      memoryEngine.create(
        'user-1',
        MemoryType.WORK,
        'Project success',
        'Successfully completed the important project at work'
      );

      memoryEngine.create(
        'user-1',
        MemoryType.PERSON,
        'Friend Sarah',
        'Sarah is my best friend and we enjoy cooking together'
      );
    });

    it('should search by keyword', () => {
      const result = memoryEngine.search({
        searchType: SearchType.KEYWORD,
        query: 'pasta',
        userId: 'user-1',
      });

      if (!result.isSuccess) {
        console.error('Search error:', result.error);
      }
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.totalCount).toBeGreaterThan(0);
        expect(result.value.memories[0].description).toContain('pasta');
      }
    });

    it('should search by memory type', () => {
      const result = memoryEngine.search({
        searchType: SearchType.KEYWORD,
        query: 'work',
        userId: 'user-1',
        memoryType: MemoryType.WORK,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.memories.every((m) => m.memoryType === MemoryType.WORK)).toBe(
        true
      );
    });

    it('should respect pagination', () => {
      const result = memoryEngine.search({
        searchType: SearchType.RECENT,
        query: '',
        userId: 'user-1',
        limit: 2,
        offset: 0,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.memories.length).toBeLessThanOrEqual(2);
    });
  });

  describe('expire', () => {
    it('should mark memory as expired', () => {
      const createResult = memoryEngine.create(
        'user-1',
        MemoryType.TEMPORARY,
        'Temp memory',
        'This is temporary'
      );

      const memoryId = createResult.value.id;
      const expireResult = memoryEngine.expire(memoryId);

      expect(expireResult.isSuccess).toBe(true);

      const found = repository.findById(memoryId).value;
      expect(found?.status).toBe(MemoryStatus.EXPIRED);
      expect(found?.expiryAt).toBeDefined();
    });
  });

  describe('archive', () => {
    it('should mark memory as archived', () => {
      const createResult = memoryEngine.create(
        'user-1',
        MemoryType.EVENT,
        'Past event',
        'Old memory to archive'
      );

      const memoryId = createResult.value.id;
      const archiveResult = memoryEngine.archive(memoryId);

      expect(archiveResult.isSuccess).toBe(true);

      const found = repository.findById(memoryId).value;
      expect(found?.status).toBe(MemoryStatus.ARCHIVED);
      expect(found?.archivedAt).toBeDefined();
    });
  });

  describe('buildSnapshot', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        memoryEngine.create(
          'user-1',
          MemoryType.PERSON,
          `Person ${i}`,
          `This is person number ${i}`
        );
      }

      for (let i = 0; i < 3; i++) {
        memoryEngine.create(
          'user-1',
          MemoryType.WORK,
          `Work ${i}`,
          `This is work memory ${i}`
        );
      }
    });

    it('should build memory snapshot', () => {
      const result = memoryEngine.buildSnapshot('user-1');

      expect(result.isSuccess).toBe(true);
      const snapshot = result.value;
      expect(snapshot.userId).toBe('user-1');
      expect(snapshot.totalMemories).toBeGreaterThan(0);
      expect(snapshot.memoryTypeDistribution[MemoryType.PERSON]).toBe(5);
      expect(snapshot.memoryTypeDistribution[MemoryType.WORK]).toBe(3);
      expect(snapshot.averageImportance).toBeGreaterThan(0);
      expect(snapshot.averageConfidence).toBeGreaterThan(0);
    });
  });

  describe('getTimeline', () => {
    it('should retrieve chronological timeline', () => {
      for (let i = 0; i < 3; i++) {
        memoryEngine.create(
          'user-1',
          MemoryType.EVENT,
          `Event ${i}`,
          `Event at different times`
        );
      }

      const result = memoryEngine.getTimeline('user-1');

      expect(result.isSuccess).toBe(true);
      const timeline = result.value;
      expect(timeline.length).toBe(3);

      for (let i = 0; i < timeline.length - 1; i++) {
        expect(
          timeline[i].createdAt.getTime() <= timeline[i + 1].createdAt.getTime()
        ).toBe(true);
      }
    });
  });
});

describe('EntityExtractor', () => {
  let extractor: EntityExtractor;

  beforeEach(() => {
    extractor = new EntityExtractor();
  });

  it('should extract entities', () => {
    const result = extractor.extract('I met John and Sarah yesterday at the Paris restaurant');
    expect(result.isSuccess).toBe(true);
    expect(result.value.entities.length).toBeGreaterThan(0);
  });

  it('should extract places', () => {
    const result = extractor.extract('I visited Paris and Berlin last summer');
    expect(result.isSuccess).toBe(true);
    const places = result.value.entities.filter((e) => e.type === 'PLACE');
    expect(places.length).toBeGreaterThan(0);
  });

  it('should have confidence score', () => {
    const result = extractor.extract('John lives in Paris and meets with Alice');
    expect(result.isSuccess).toBe(true);
    expect(result.value.confidence).toBeLessThanOrEqual(1);
  });
});

describe('MemoryClassifier', () => {
  let classifier: MemoryClassifier;

  beforeEach(() => {
    classifier = new MemoryClassifier();
  });

  it('should classify PERSON memory', () => {
    const result = classifier.classify('John is a person I know', []);
    expect(result.isSuccess).toBe(true);
    expect(result.value.memoryType).toBe(MemoryType.PERSON);
  });

  it('should classify WORK memory', () => {
    const result = classifier.classify('I completed an important project at work', []);
    expect(result.isSuccess).toBe(true);
    expect(result.value.memoryType).toBe(MemoryType.WORK);
  });

  it('should classify FOOD or PREFERENCE memory', () => {
    const result = classifier.classify(
      'I love eating pizza at my favorite restaurant',
      []
    );
    expect(result.isSuccess).toBe(true);
    expect([MemoryType.FOOD, MemoryType.PREFERENCE]).toContain(result.value.memoryType);
  });

  it('should include alternative types', () => {
    const result = classifier.classify(
      'I love cooking pasta at my favorite Italian restaurant',
      []
    );
    expect(result.isSuccess).toBe(true);
    expect(result.value.alternativeTypes.length).toBeGreaterThan(0);
  });
});

describe('ImportanceEvaluator', () => {
  let evaluator: ImportanceEvaluator;

  beforeEach(() => {
    evaluator = new ImportanceEvaluator();
  });

  it('should rate important goals higher', () => {
    const result = evaluator.evaluate({
      memoryType: MemoryType.GOAL,
      title: 'Dream goal',
      description: 'I love my important dream and I aspire to achieve it',
      entities: [{ id: '1', type: 'PERSON', name: 'Me' }],
      importance: 0.8,
      confidence: 0.9,
      tags: ['important', 'life-changing'],
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.importance).toBeGreaterThan(0.2);
  });

  it('should consider confidence level', () => {
    const lowConfidenceResult = evaluator.evaluate({
      memoryType: MemoryType.TEMPORARY,
      description: 'Maybe something happened',
      confidence: 0.2,
      importance: 0.5,
      entities: [],
      tags: [],
    });

    expect(lowConfidenceResult.isSuccess).toBe(true);
    expect(lowConfidenceResult.value.importance).toBeLessThan(0.5);
  });

  it('should include reasoning', () => {
    const result = evaluator.evaluate({
      memoryType: MemoryType.RELATIONSHIP,
      description: 'My relationship with Alice is important',
      entities: [],
      importance: 0.7,
      confidence: 0.8,
      tags: [],
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.reasoning.length).toBeGreaterThan(0);
  });
});

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  it('should detect similar memories', () => {
    const memory1 = {
      id: '1',
      userId: 'user-1',
      memoryType: MemoryType.PERSON,
      title: 'Alice',
      description: 'Alice is my friend from university',
      entities: [],
      confidence: 0.9,
      importance: 0.7,
      status: MemoryStatus.ACTIVE as const,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: 'PRIVATE' as const,
    };

    const memory2 = {
      ...memory1,
      id: '2',
      description: 'Alice is my friend from university',
      confidence: 0.85,
    };

    const result = resolver.resolve(memory1, memory2);
    expect(result.isSuccess).toBe(true);
    expect(['KEEP_NEW', 'KEEP_EXISTING', 'MERGE']).toContain(result.value.resolution);
  });

  it('should handle contradictions', () => {
    const memory1 = {
      id: '1',
      userId: 'user-1',
      memoryType: MemoryType.PREFERENCE,
      title: 'Food preference',
      description: 'I love spicy food',
      entities: [],
      confidence: 0.9,
      importance: 0.6,
      status: MemoryStatus.ACTIVE as const,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: 'PRIVATE' as const,
    };

    const memory2 = {
      ...memory1,
      id: '2',
      description: 'I hate spicy food',
    };

    const result = resolver.resolve(memory1, memory2);
    expect(result.isSuccess).toBe(true);
    expect(result.value.reasoning.length).toBeGreaterThan(0);
  });
});

describe('MemoryRetentionStrategy', () => {
  let strategy: MemoryRetentionStrategy;

  beforeEach(() => {
    strategy = new MemoryRetentionStrategy();
  });

  it('should prioritize critical memory types', () => {
    const memories = [
      {
        id: '1',
        userId: 'user-1',
        memoryType: MemoryType.TEMPORARY,
        title: 'Temp',
        description: 'Temporary memory',
        entities: [],
        confidence: 0.9,
        importance: 0.1,
        status: MemoryStatus.ACTIVE,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: 'PRIVATE' as const,
      },
      {
        id: '2',
        userId: 'user-1',
        memoryType: MemoryType.RELATIONSHIP,
        title: 'Relationship',
        description: 'Important relationship',
        entities: [],
        confidence: 0.8,
        importance: 0.5,
        status: MemoryStatus.ACTIVE,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: 'PRIVATE' as const,
      },
    ];

    const result = strategy.decide(memories);
    expect(result.isSuccess).toBe(true);
    expect(result.value.length).toBeGreaterThan(0);
  });
});
