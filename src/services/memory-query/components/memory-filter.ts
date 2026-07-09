import { Result } from '../../../services/types/result.type';
import { Memory } from '@engines/memory/dtos/memory.dto';
import { MemoryStatus } from '../../../engines/memory/enums/memory.enums';
import { FilterCriteria } from '../dto/memory-query.dto';
import { FilterType } from '../enums/memory-query.enums';
import { IMemoryFilter } from '../interfaces/memory-query.interfaces';

export class MemoryFilter implements IMemoryFilter {
  apply(memories: Memory[], criteria: FilterCriteria[]): Result<Memory[]> {
    return Result.try(() => {
      if (criteria.length === 0) {
        return memories;
      }

      let filtered = memories;

      for (const filter of criteria) {
        filtered = this.applyFilter(filtered, filter);
      }

      return filtered;
    });
  }

  private applyFilter(memories: Memory[], filter: FilterCriteria): Memory[] {
    switch (filter.type) {
      case FilterType.MEMORY_TYPE:
        return memories.filter((m) => m.memoryType === filter.value);

      case FilterType.DATE_RANGE:
        return memories.filter((m) => {
          const { startDate, endDate } = filter.value;
          return m.createdAt >= startDate && m.createdAt <= endDate;
        });

      case FilterType.IMPORTANCE:
        const importanceOp = filter.operator || 'gte';
        return memories.filter((m) => this.compareValue(m.importance, filter.value, importanceOp));

      case FilterType.CONFIDENCE:
        const confidenceOp = filter.operator || 'gte';
        return memories.filter((m) => this.compareValue(m.confidence, filter.value, confidenceOp));

      case FilterType.EXPIRY_STATUS:
        if (filter.value === 'expired') {
          return memories.filter((m) => m.status === MemoryStatus.EXPIRED);
        } else if (filter.value === 'active') {
          return memories.filter((m) => m.status === MemoryStatus.ACTIVE);
        }
        return memories;

      case FilterType.RELATIONSHIP:
        return memories.filter((m) => m.relationshipId === filter.value);

      case FilterType.TAG:
        return memories.filter((m) => m.tags.includes(filter.value));

      case FilterType.ENTITY:
        return memories.filter((m) =>
          m.entities.some((e) => e.name.toLowerCase().includes(filter.value.toLowerCase()))
        );

      case FilterType.SOURCE_EVENT:
        return memories.filter((m) => m.sourceEventType === filter.value);

      case FilterType.VISIBILITY:
        return memories.filter((m) => m.visibility === filter.value);

      case FilterType.ARCHIVED:
        if (filter.value) {
          return memories.filter((m) => m.status === MemoryStatus.ARCHIVED);
        } else {
          return memories.filter((m) => m.status !== MemoryStatus.ARCHIVED);
        }

      default:
        return memories;
    }
  }

  private compareValue(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'eq':
        return value === threshold;
      case 'neq':
        return value !== threshold;
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      default:
        return true;
    }
  }
}
