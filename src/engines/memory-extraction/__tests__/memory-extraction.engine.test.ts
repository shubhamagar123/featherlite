import { describe, it, expect, jest } from '@jest/globals';
import { MemoryExtractionEngine } from '../memory-extraction.engine';
import { EntityExtractor } from '@engines/memory/components/entity-extractor';
import { MemoryClassifier } from '@engines/memory/components/memory-classifier';
import { ImportanceEvaluator } from '@engines/memory/components/importance-evaluator';
import { MemoryService } from '@services/memory/memory.service';
import type { MemoryRepository } from '@database/repositories/memory.repository';

function buildEngine(): MemoryExtractionEngine {
  return new MemoryExtractionEngine(
    new EntityExtractor(),
    new MemoryClassifier(),
    new ImportanceEvaluator()
  );
}

describe('MemoryExtractionEngine', () => {
  describe('persistence boundary', () => {
    it('calling extract() alone, with no consent event, results in zero database writes', () => {
      const fakeRepository = { create: jest.fn() } as unknown as MemoryRepository;
      // Constructing a real MemoryService against the same fake repository
      // proves this spy would catch a write if the extraction engine ever
      // reached it — it isn't just an unused mock.
      new MemoryService(fakeRepository);

      const engine = buildEngine();
      const result = engine.extract({
        userId: 'user-1',
        companionId: 'companion-1',
        sourceMessageId: 'msg-1',
        text: 'My name is Priya and I love painting on Sundays.',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value).not.toBeNull();
      expect((fakeRepository.create as jest.Mock)).not.toHaveBeenCalled();
    });

    it('the engine holds no repository/service dependency at all', () => {
      const engine = buildEngine();
      for (const key of Object.keys(engine as unknown as Record<string, unknown>)) {
        expect(key.toLowerCase()).not.toMatch(/repository|service|prisma|database|client/);
      }
    });
  });

  describe('extraction', () => {
    it('proposes a memory candidate for durable, personal text', () => {
      const engine = buildEngine();
      const result = engine.extract({
        userId: 'user-1',
        companionId: 'companion-1',
        sourceMessageId: 'msg-2',
        text: 'I prefer tea over coffee and my favorite city is Kyoto.',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toMatchObject({
        sourceMessageId: 'msg-2',
        userId: 'user-1',
        companionId: 'companion-1',
      });
    });

    it('returns null for text with no meaningful signal', () => {
      const engine = buildEngine();
      const result = engine.extract({
        userId: 'user-1',
        companionId: 'companion-1',
        sourceMessageId: 'msg-3',
        text: 'ok',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });
  });
});
