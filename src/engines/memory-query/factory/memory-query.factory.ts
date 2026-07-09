import {
  IMemoryQueryService,
  IMemoryQueryBuilder,
  IMemoryRanker,
  IMemoryFilter,
  IMemoryRetriever,
  IMemoryCache,
  IMemoryQueryFactory,
} from '../interfaces/memory-query.interfaces';
import { MemoryQueryService } from '../memory-query.service';
import { MemoryQueryBuilder } from '../builders/memory-query-builder';
import { MemoryRanker } from '../components/memory-ranker';
import { MemoryFilter } from '../components/memory-filter';
import { MemoryRetriever } from '../components/memory-retriever';
import { RedisMemoryCache } from '@infra/cache/redis-memory-cache.service';
import { getRedisClient } from '@infra/redis/redis.provider';

export class MemoryQueryFactory implements IMemoryQueryFactory {
  private static instance: MemoryQueryFactory;

  private constructor() {}

  static getInstance(): MemoryQueryFactory {
    if (!MemoryQueryFactory.instance) {
      MemoryQueryFactory.instance = new MemoryQueryFactory();
    }
    return MemoryQueryFactory.instance;
  }

  createQueryService(): IMemoryQueryService {
    return new MemoryQueryService();
  }

  createQueryBuilder(): IMemoryQueryBuilder {
    return new MemoryQueryBuilder();
  }

  createRanker(): IMemoryRanker {
    return new MemoryRanker();
  }

  createFilter(): IMemoryFilter {
    return new MemoryFilter();
  }

  createRetriever(): IMemoryRetriever {
    return new MemoryRetriever();
  }

  createCache(): IMemoryCache {
    return new RedisMemoryCache(getRedisClient());
  }
}

export function getMemoryQueryFactory(): MemoryQueryFactory {
  return MemoryQueryFactory.getInstance();
}

export function getMemoryQueryService(): IMemoryQueryService {
  return getMemoryQueryFactory().createQueryService();
}
