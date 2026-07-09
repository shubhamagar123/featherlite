import { MemoryRanker } from '../components/memory-ranker';
import { RecencyScorer } from '../scorers/recency-scorer';
import { ImportanceScorer } from '../scorers/importance-scorer';
import { ConfidenceScorer } from '../scorers/confidence-scorer';
import { RankingMode, RankingSignalType } from '../enums/memory-query.enums';
import { Memory } from '@engines/memory/dtos/memory.dto';
import { MemoryType } from '../../../engines/memory/enums/memory.enums';

describe('MemoryRanker', () => {
  let ranker: MemoryRanker;
  let mockMemories: Memory[];

  beforeEach(() => {
    ranker = new MemoryRanker();
    ranker.addScorer(RankingSignalType.RECENCY, new RecencyScorer());
    ranker.addScorer(RankingSignalType.IMPORTANCE, new ImportanceScorer());
    ranker.addScorer(RankingSignalType.CONFIDENCE, new ConfidenceScorer());

    mockMemories = [
      {
        id: '1',
        userId: 'user1',
        memoryType: MemoryType.FACT,
        content: 'Test memory 1',
        importance: 0.9,
        confidence: 0.8,
        tags: [],
        entities: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-08'),
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
        content: 'Test memory 2',
        importance: 0.5,
        confidence: 0.7,
        tags: [],
        entities: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        expiryAt: undefined,
        relationshipId: 'rel1',
        sourceEventType: 'CONVERSATION',
        visibility: 'PRIVATE',
        status: 'ACTIVE',
        metadata: {},
      },
    ];
  });

  it('should rank memories with active scorers', () => {
    const config = {
      mode: RankingMode.BALANCED,
      signals: new Map([
        [RankingSignalType.RECENCY, 1.0],
        [RankingSignalType.IMPORTANCE, 0.5],
        [RankingSignalType.CONFIDENCE, 0.3],
      ]),
      minimumScore: 0,
      normalizeScores: false,
    };

    const result = ranker.rank(mockMemories, config, {});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(2);
    expect(result.value[0].rank).toBe(1);
    expect(result.value[1].rank).toBe(2);
  });

  it('should apply STRICT ranking mode', () => {
    const config = {
      mode: RankingMode.STRICT,
      signals: new Map([
        [RankingSignalType.RECENCY, 1.0],
        [RankingSignalType.IMPORTANCE, 0.5],
      ]),
      minimumScore: 0,
      normalizeScores: false,
    };

    const result = ranker.rank(mockMemories, config, {});

    expect(result.isSuccess).toBe(true);
    expect(result.value.length).toBeGreaterThan(0);
  });

  it('should apply PERMISSIVE ranking mode', () => {
    const config = {
      mode: RankingMode.PERMISSIVE,
      signals: new Map([
        [RankingSignalType.RECENCY, 1.0],
        [RankingSignalType.IMPORTANCE, 0.5],
      ]),
      minimumScore: 0,
      normalizeScores: false,
    };

    const result = ranker.rank(mockMemories, config, {});

    expect(result.isSuccess).toBe(true);
    expect(result.value.length).toBeGreaterThan(0);
  });

  it('should normalize scores when enabled', () => {
    const config = {
      mode: RankingMode.BALANCED,
      signals: new Map([
        [RankingSignalType.RECENCY, 1.0],
        [RankingSignalType.IMPORTANCE, 0.5],
      ]),
      minimumScore: 0,
      normalizeScores: true,
    };

    const result = ranker.rank(mockMemories, config, {});

    expect(result.isSuccess).toBe(true);
    expect(result.value.every((m) => m.finalScore <= 100)).toBe(true);
  });

  it('should respect minimum score threshold', () => {
    const config = {
      mode: RankingMode.BALANCED,
      signals: new Map([[RankingSignalType.RECENCY, 1.0]]),
      minimumScore: 50,
      normalizeScores: false,
    };

    const result = ranker.rank(mockMemories, config, {});

    expect(result.isSuccess).toBe(true);
    expect(result.value.every((m) => m.finalScore >= 50)).toBe(true);
  });

  it('should handle empty memories array', () => {
    const config = {
      mode: RankingMode.BALANCED,
      signals: new Map([[RankingSignalType.RECENCY, 1.0]]),
      minimumScore: 0,
      normalizeScores: false,
    };

    const result = ranker.rank([], config, {});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(0);
  });

  it('should generate reasoning for each ranked memory', () => {
    const config = {
      mode: RankingMode.BALANCED,
      signals: new Map([
        [RankingSignalType.RECENCY, 1.0],
        [RankingSignalType.IMPORTANCE, 0.5],
      ]),
      minimumScore: 0,
      normalizeScores: false,
    };

    const result = ranker.rank(mockMemories, config, {});

    expect(result.isSuccess).toBe(true);
    result.value.forEach((m) => {
      expect(m.reasoning).toBeTruthy();
      expect(m.reasoning.includes('Top signals')).toBe(true);
    });
  });
});
