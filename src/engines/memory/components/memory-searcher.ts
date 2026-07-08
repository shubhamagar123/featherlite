import { Result } from '../../../services/types/result.type';
import {
  Memory,
  MemorySearchQuery,
  MemorySearchResult,
} from '../dto/memory.dto';
import { SearchType } from '../enums/memory.enums';
import { IMemorySearcher, IMemoryRepository } from '../interfaces/memory.interfaces';
import { MemoryIndexer } from './memory-indexer';

export class MemorySearcher implements IMemorySearcher {
  constructor(private indexer: MemoryIndexer, private repository: IMemoryRepository) {}

  search(query: MemorySearchQuery): Result<MemorySearchResult> {
    return Result.try(() => {
      const startTime = new Date();
      const allMemoriesResult = this.repository.getAll();
      const allMemories = allMemoriesResult.getValueOrDefault([]);
      let results: Memory[] = [];

      switch (query.searchType) {
        case SearchType.KEYWORD:
          results = this.keywordSearch(query, allMemories);
          break;
        case SearchType.ENTITY:
          results = this.entitySearch(query, allMemories);
          break;
        case SearchType.SEMANTIC:
          results = this.semanticSearch(query, allMemories);
          break;
        case SearchType.TIMELINE:
          results = this.timelineSearch(query, allMemories);
          break;
        case SearchType.RECENT:
          results = this.recentSearch(allMemories);
          break;
      }

      results = results
        .filter((m) => m.userId === query.userId)
        .filter(
          (m) =>
            !query.relationshipId || m.relationshipId === query.relationshipId
        )
        .filter((m) => !query.memoryType || m.memoryType === query.memoryType)
        .filter(
          (m) => !query.startDate || m.createdAt >= query.startDate
        )
        .filter((m) => !query.endDate || m.createdAt <= query.endDate);

      const offset = query.offset || 0;
      const limit = query.limit || 50;

      const paginatedResults = results.slice(offset, offset + limit);

      return {
        memories: paginatedResults,
        totalCount: results.length,
        query,
        executedAt: startTime,
      };
    });
  }

  private keywordSearch(query: MemorySearchQuery, allMemories: Memory[]): Memory[] {
    const keywords = query.query.split(/\s+/);
    const matchingIds = this.indexer.searchKeywords(keywords);

    return allMemories.filter((m) => matchingIds.has(m.id));
  }

  private entitySearch(query: MemorySearchQuery, allMemories: Memory[]): Memory[] {
    const entities = query.query.split(/[,;|]+/).map((e) => e.trim());
    const matchingIds = this.indexer.searchEntities(entities);

    return allMemories.filter((m) => matchingIds.has(m.id));
  }

  private semanticSearch(query: MemorySearchQuery, allMemories: Memory[]): Memory[] {
    const queryTerms = query.query.toLowerCase().split(/\s+/);
    const lowerQueryText = query.query.toLowerCase();

    const scored = allMemories
      .map((memory) => {
        let score = 0;

        const titleMatch = memory.title.toLowerCase().includes(lowerQueryText);
        if (titleMatch) score += 10;

        for (const term of queryTerms) {
          if (memory.description.toLowerCase().includes(term)) {
            score += 2;
          }
        }

        const matchingEntities = memory.entities.filter((e) =>
          queryTerms.some((t) => e.name.toLowerCase().includes(t))
        );
        score += matchingEntities.length * 3;

        return { memory, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.memory);

    return scored;
  }

  private timelineSearch(query: MemorySearchQuery, allMemories: Memory[]): Memory[] {
    const memories = allMemories
      .filter(
        (m) =>
          (!query.startDate || m.createdAt >= query.startDate) &&
          (!query.endDate || m.createdAt <= query.endDate)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return memories;
  }

  private recentSearch(allMemories: Memory[]): Memory[] {
    const sorted = [...allMemories];
    sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return sorted;
  }
}
