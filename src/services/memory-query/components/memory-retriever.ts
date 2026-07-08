import { Result } from '../../../services/types/result.type';
import { Memory, MemorySearchQuery } from '../../../engines/memory/dto/memory.dto';
import { SearchType } from '../../../engines/memory/enums/memory.enums';
import { getMemoryEngine } from '../../../engines/memory/memory.factory';
import { MemoryQuery } from '../dto/memory-query.dto';
import { MemoryQueryType, QueryScope } from '../enums/memory-query.enums';
import { IMemoryRetriever } from '../interfaces/memory-query.interfaces';

export class MemoryRetriever implements IMemoryRetriever {
  retrieve(query: MemoryQuery): Result<Memory[]> {
    return Result.try(() => {
      const engine = getMemoryEngine();

      const searchQuery = this.buildSearchQuery(query);
      const result = engine.search(searchQuery);

      if (!result.isSuccess || !result.value) {
        throw new Error(`Memory retrieval failed: ${result.error?.message ?? 'unknown'}`);
      }

      return result.value.memories;
    });
  }

  private buildSearchQuery(query: MemoryQuery): MemorySearchQuery {
    const searchType = this.mapQueryTypeToSearchType(query.queryType);

    return {
      searchType,
      query: this.buildSearchText(query),
      userId: query.userId,
      relationshipId: query.relationshipId,
      memoryType: undefined,
      limit: query.limit,
      offset: query.offset,
      startDate: this.getStartDate(query.scope),
      endDate: new Date(),
    };
  }

  private mapQueryTypeToSearchType(type: MemoryQueryType): SearchType {
    switch (type) {
      case MemoryQueryType.RECENT:
        return SearchType.RECENT;
      case MemoryQueryType.ENTITY:
        return SearchType.ENTITY;
      case MemoryQueryType.TIMELINE:
        return SearchType.TIMELINE;
      case MemoryQueryType.SEMANTIC:
        return SearchType.SEMANTIC;
      default:
        return SearchType.KEYWORD;
    }
  }

  private buildSearchText(query: MemoryQuery): string {
    switch (query.queryType) {
      case MemoryQueryType.ENTITY:
        return query.context?.recentEntities?.join(',') || '';
      case MemoryQueryType.SEMANTIC:
        return query.context?.currentActivity || '';
      case MemoryQueryType.PREFERENCE:
        return 'preference like enjoy favorite';
      case MemoryQueryType.RELATIONSHIP:
        return 'relationship friend connection bond';
      case MemoryQueryType.CONTEXT:
        return 'context background situation';
      case MemoryQueryType.EVENT:
        return 'event happened occurred moment';
      default:
        return '';
    }
  }

  private getStartDate(scope: QueryScope): Date {
    const now = new Date();

    switch (scope) {
      case QueryScope.IMMEDIATE:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case QueryScope.RECENT:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case QueryScope.CONTEXTUAL:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case QueryScope.HISTORICAL:
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case QueryScope.FULL:
        return new Date(0);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
