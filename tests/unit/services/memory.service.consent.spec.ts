import { MemoryService } from '@services/memory/memory.service';
import type { MemoryRepository } from '@database/repositories/memory.repository';
import type { MemoryExtractionResultDTO } from '@engines/memory-extraction';
import { MemoryType } from '@engines/memory/enums/memory.enums';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const COMPANION_ID = '22222222-2222-2222-2222-222222222222';

function makeCandidate(overrides: Partial<MemoryExtractionResultDTO> = {}): MemoryExtractionResultDTO {
  return {
    sourceMessageId: 'msg-42',
    userId: USER_ID,
    companionId: COMPANION_ID,
    memoryType: MemoryType.PREFERENCE,
    content: 'Loves hiking on weekends.',
    importance: 0.6,
    confidence: 0.8,
    entities: [],
    extractedAt: new Date(),
    ...overrides,
  };
}

function makeFakeRepository() {
  const create = jest.fn(async (data: any) => ({
    id: 'mem-1',
    userId: data.userId,
    companionId: data.companionId,
    type: data.type,
    importance: data.importance,
    content: data.content,
    accessCount: 0,
    lastAccessedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  return { create } as unknown as MemoryRepository;
}

describe('MemoryService.persistMemoryCandidate — consent gate', () => {
  it('discards the candidate and writes nothing when consent is withheld', async () => {
    const fakeRepository = makeFakeRepository();
    const service = new MemoryService(fakeRepository);

    const result = await service.persistMemoryCandidate(makeCandidate(), {
      granted: false,
      sourceMessageId: 'msg-42',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeNull();
    expect((fakeRepository.create as jest.Mock)).not.toHaveBeenCalled();
  });

  it('discards the candidate when the consent event points at a different message', async () => {
    const fakeRepository = makeFakeRepository();
    const service = new MemoryService(fakeRepository);

    const result = await service.persistMemoryCandidate(makeCandidate({ sourceMessageId: 'msg-42' }), {
      granted: true,
      sourceMessageId: 'msg-99', // mismatched — must not be treated as consent for msg-42
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeNull();
    expect((fakeRepository.create as jest.Mock)).not.toHaveBeenCalled();
  });

  it('persists the candidate once granted consent matches the source message', async () => {
    const fakeRepository = makeFakeRepository();
    const service = new MemoryService(fakeRepository);

    const result = await service.persistMemoryCandidate(makeCandidate(), {
      granted: true,
      sourceMessageId: 'msg-42',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).not.toBeNull();
    expect(result.value?.content).toBe('Loves hiking on weekends.');
    expect((fakeRepository.create as jest.Mock)).toHaveBeenCalledTimes(1);
  });
});
