import { Result } from '../../../services/types/result.type';
import {
  MemoryQuery,
  FilterCriteria,
  RankingSignal,
} from '../dto/memory-query.dto';
import {
  MemoryQueryType,
  RankingSignalType,
  QueryScope,
  RankingMode,
} from '../enums/memory-query.enums';
import { IMemoryQueryBuilder } from '../interfaces/memory-query.interfaces';

export class MemoryQueryBuilder implements IMemoryQueryBuilder {
  private queryType: MemoryQueryType | null = null;
  private userId: string | null = null;
  private relationshipId: string | null = null;
  private scope: QueryScope = QueryScope.CONTEXTUAL;
  private filters: FilterCriteria[] = [];
  private rankingMode: RankingMode = RankingMode.BALANCED;
  private signals: Map<RankingSignalType, RankingSignal> = new Map();
  private limit: number = 20;
  private offset: number = 0;
  private context: Record<string, unknown> = {};
  private ttl: number | null = null;

  withQueryType(type: MemoryQueryType): IMemoryQueryBuilder {
    this.queryType = type;
    return this;
  }

  withUserId(userId: string): IMemoryQueryBuilder {
    this.userId = userId;
    return this;
  }

  withRelationshipId(relationshipId: string): IMemoryQueryBuilder {
    this.relationshipId = relationshipId;
    return this;
  }

  withScope(scope: QueryScope): IMemoryQueryBuilder {
    this.scope = scope;
    return this;
  }

  withLimit(limit: number): IMemoryQueryBuilder {
    this.limit = Math.max(1, Math.min(limit, 1000));
    return this;
  }

  withOffset(offset: number): IMemoryQueryBuilder {
    this.offset = Math.max(0, offset);
    return this;
  }

  withFilter(filter: FilterCriteria): IMemoryQueryBuilder {
    this.filters.push(filter);
    return this;
  }

  withRankingMode(mode: RankingMode): IMemoryQueryBuilder {
    this.rankingMode = mode;
    return this;
  }

  withContext(context: unknown): IMemoryQueryBuilder {
    if (context && typeof context === 'object') {
      this.context = context as Record<string, unknown>;
    } else {
      this.context = {};
    }
    return this;
  }

  withTTL(ttl: number): IMemoryQueryBuilder {
    this.ttl = ttl;
    return this;
  }

  enableSignal(type: RankingSignalType, weight: number): IMemoryQueryBuilder {
    const clampedWeight = Math.max(0, Math.min(weight, 1));
    this.signals.set(type, {
      type,
      weight: clampedWeight,
      enabled: true,
    });
    return this;
  }

  disableSignal(type: RankingSignalType): IMemoryQueryBuilder {
    const signal = this.signals.get(type);
    if (signal) {
      signal.enabled = false;
    }
    return this;
  }

  build(): Result<MemoryQuery> {
    return Result.try(() => {
      if (!this.queryType) {
        throw new Error('Query type is required');
      }

      if (!this.userId) {
        throw new Error('User ID is required');
      }

      const signals = Array.from(this.signals.values()).filter((s) => s.enabled);

      const query: MemoryQuery = {
        queryType: this.queryType,
        userId: this.userId,
        relationshipId: this.relationshipId || undefined,
        scope: this.scope,
        filters: this.filters,
        rankingMode: this.rankingMode,
        signals,
        limit: this.limit,
        offset: this.offset,
        context: this.context,
        createdAt: new Date(),
        ttl: this.ttl || undefined,
      };

      return query;
    });
  }
}
