/**
 * MemoryContextProvider — the single source for the memory slice.
 *
 * Depends on the Memory Engine (storage/retrieval layer). Pulls the
 * companion's most critical memories. An empty result is a known-empty
 * slice (available: true, count: 0); only a genuine engine error propagates
 * as a failure for the builder to degrade.
 */

import { IResult, Result } from '@services/types/result.type';
import { IMemoryEngine } from '@engines/memory';
import { ContextRequest, MemoryContextSlice } from '../dtos/conversation-context.dto';
import { ContextProviderKey, IContextProvider } from '../interfaces/context-provider.interface';

const DEFAULT_MEMORY_LIMIT = 10;

export class MemoryContextProvider implements IContextProvider<MemoryContextSlice> {
  readonly key: ContextProviderKey = 'memory';
  readonly required = false;

  constructor(private readonly memoryEngine: IMemoryEngine) {}

  emptySlice(): MemoryContextSlice {
    return { available: false, count: 0, items: [] };
  }

  async provide(request: ContextRequest): Promise<IResult<MemoryContextSlice>> {
    const limit = request.limits?.memories ?? DEFAULT_MEMORY_LIMIT;
    const result = await this.memoryEngine.getCriticalMemories({
      companionId: request.companionId,
      limit,
    });

    if (!result.isSuccess || !result.value) {
      return Result.failure(result.error ?? new Error('Memory provider failed'));
    }

    const items = result.value.items.map((memory) => ({
      id: memory.id,
      type: memory.type,
      importance: memory.importance,
      content: memory.content,
    }));

    return Result.success({ available: true, count: items.length, items });
  }
}
