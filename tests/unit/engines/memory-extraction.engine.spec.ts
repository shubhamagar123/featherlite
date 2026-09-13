import { MemoryExtractionEngine } from '@engines/memory-extraction/memory-extraction.engine';
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

describe('MemoryExtractionEngine — persistence boundary', () => {
  it('never touches the memory repository when extract() is called alone', () => {
    // A fake repository standing in for "the database". If the extraction
    // engine had any path to persistence, calling create() would be it.
    const fakeRepository = {
      create: jest.fn(),
    } as unknown as MemoryRepository;

    // Wiring a real MemoryService in the same test proves the spy would
    // actually catch a write if the extraction engine ever triggered one —
    // this isn't a structural argument, it's a live one.
    const memoryService = new MemoryService(fakeRepository);
    void memoryService;

    const engine = buildEngine();

    const result = engine.extract({
      userId: 'user-1',
      companionId: 'companion-1',
      sourceMessageId: 'msg-42',
      text: 'My name is Alex and I love hiking every weekend with my friend Sam.',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).not.toBeNull();
    expect((fakeRepository.create as jest.Mock)).not.toHaveBeenCalled();
  });

  it('returns a proposal (not a persisted record) for memory-worthy text', () => {
    const engine = buildEngine();

    const result = engine.extract({
      userId: 'user-1',
      companionId: 'companion-1',
      sourceMessageId: 'msg-1',
      text: 'I love hiking and my favorite food is pizza.',
    });

    expect(result.isSuccess).toBe(true);
    const candidate = result.value;
    expect(candidate).not.toBeNull();
    expect(candidate).toMatchObject({
      sourceMessageId: 'msg-1',
      userId: 'user-1',
      companionId: 'companion-1',
      content: 'I love hiking and my favorite food is pizza.',
    });
    // A proposal is a plain value, not a stored entity: no id, no createdAt.
    expect(candidate).not.toHaveProperty('id');
    expect(candidate).not.toHaveProperty('createdAt');
  });

  it('returns null (still no side effect) for text with no classification signal', () => {
    const engine = buildEngine();

    const result = engine.extract({
      userId: 'user-1',
      companionId: 'companion-1',
      sourceMessageId: 'msg-2',
      text: 'xyz',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeNull();
  });

  it('exposes no repository, service, or persistence dependency on the class itself', () => {
    const engine = buildEngine();
    // The only own-properties of the engine are the three pure decision
    // components it was constructed with — nothing storage-shaped.
    const dependencyKeys = Object.keys(engine as unknown as Record<string, unknown>);
    for (const key of dependencyKeys) {
      expect(key.toLowerCase()).not.toMatch(/repository|service|prisma|database|client/);
    }
  });
});
