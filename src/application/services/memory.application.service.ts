import { ApplicationServiceBase } from './application.service.base';
import {
  ApplicationContext,
  MemoryResponseDto,
} from '../dtos/application.dtos';
import { ResourceNotFoundException } from '../exceptions/application.exceptions';
import { NotFoundError, ForbiddenError } from '@utils/error';
import { MemoryRepository } from '@database/repositories/memory.repository';
import { getMemoryEngine, MemoryEngineHandle } from '@engines/memory/memory.factory';
import { SearchType } from '@engines/memory/enums/memory.enums';
import { CompanionRepository } from '@database/repositories/companion.repository';

/**
 * Memory Application Service
 * Orchestrates memory operations
 * IMPORTANT: Business logic layer - abstracts memory engine internals
 */
export class MemoryApplicationService extends ApplicationServiceBase {
  private readonly memoryRepository: MemoryRepository;
  private readonly memoryEngine: MemoryEngineHandle;
  private readonly companionRepository: CompanionRepository;

  constructor() {
    super('MemoryApplicationService');
    this.memoryRepository = new MemoryRepository();
    this.memoryEngine = getMemoryEngine();
    this.companionRepository = new CompanionRepository();
  }

  /**
   * Search memories by query
   * Use Case: Find relevant memories
   */
  async searchMemories(
    context: ApplicationContext,
    companionId: string,
    query: string,
    limit: number = 10
  ): Promise<MemoryResponseDto[]> {
    this.logStart('searchMemories', { userId: context.userId, companionId, query });

    try {
      const companion = await this.companionRepository.findById(companionId);
      if (!companion) {
        throw new ResourceNotFoundException('Companion', companionId);
      }

      const searchResult = this.memoryEngine.search({
        searchType: SearchType.KEYWORD,
        query,
        userId: context.userId,
        limit,
      });
      const memories = searchResult.getValueOrThrow().memories;

      this.logSuccess('searchMemories', {
        userId: context.userId,
        companionId,
        resultCount: memories.length,
      });

      return memories.map((m: any) => this.mapMemoryToDto(m));
    } catch (error) {
      this.logError('searchMemories', error, { userId: context.userId, companionId });
      throw error;
    }
  }

  /**
   * Retrieve memories by filters
   * Use Case: Get memories by type, importance, etc.
   */
  async retrieveMemories(
    context: ApplicationContext,
    companionId: string,
    filters: Record<string, unknown> = {},
    limit: number = 50
  ): Promise<MemoryResponseDto[]> {
    this.logStart('retrieveMemories', { userId: context.userId, companionId });

    try {
      const companion = await this.companionRepository.findById(companionId);
      if (!companion) {
        throw new ResourceNotFoundException('Companion', companionId);
      }

      const memories = await this.memoryRepository.findByCompanionId(companionId, {
        take: limit,
        ...filters,
      });

      this.logSuccess('retrieveMemories', {
        userId: context.userId,
        companionId,
        resultCount: memories.length,
      });

      return memories.map((m: any) => this.mapMemoryToDto(m));
    } catch (error) {
      this.logError('retrieveMemories', error, { userId: context.userId, companionId });
      throw error;
    }
  }

  /**
   * Get memory timeline
   * Use Case: View memories chronologically
   */
  async getMemoryTimeline(
    context: ApplicationContext,
    companionId: string,
    limit: number = 100
  ): Promise<MemoryResponseDto[]> {
    this.logStart('getMemoryTimeline', { userId: context.userId, companionId });

    try {
      const companion = await this.companionRepository.findById(companionId);
      if (!companion) {
        throw new ResourceNotFoundException('Companion', companionId);
      }

      const memories = await this.memoryRepository.findByCompanionId(companionId, {
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      this.logSuccess('getMemoryTimeline', {
        userId: context.userId,
        companionId,
        count: memories.length,
      });

      return memories.map((m: any) => this.mapMemoryToDto(m));
    } catch (error) {
      this.logError('getMemoryTimeline', error, { userId: context.userId, companionId });
      throw error;
    }
  }

  /**
   * Get memory details
   * Use Case: View individual memory
   */
  async getMemoryDetails(
    context: ApplicationContext,
    memoryId: string
  ): Promise<MemoryResponseDto> {
    this.logStart('getMemoryDetails', { userId: context.userId, memoryId });

    try {
      const memory = await this.memoryRepository.findById(memoryId);
      if (!memory) {
        throw new ResourceNotFoundException('Memory', memoryId);
      }

      // Record access
      await this.memoryRepository.update(memoryId, {
        accessCount: (memory.accessCount || 0) + 1,
        lastAccessedAt: new Date(),
      });

      this.logSuccess('getMemoryDetails', { userId: context.userId, memoryId });

      return this.mapMemoryToDto(memory);
    } catch (error) {
      this.logError('getMemoryDetails', error, { userId: context.userId, memoryId });
      throw error;
    }
  }

  /**
   * List consented (i.e. persisted) memories for the authenticated user,
   * newest-consented first. Backs the Android Memories timeline.
   */
  async listForUser(context: ApplicationContext, limit: number = 100): Promise<MemoryResponseDto[]> {
    this.logStart('listForUser', { userId: context.userId });

    const memories = await this.memoryRepository.findByUserId(context.userId, {
      take: limit,
      // Memory rows are only ever created post-consent (see
      // MemoryService.persistMemoryCandidate) — createdAt IS the consent
      // moment, there is no separate consentedAt column.
      orderBy: { createdAt: 'desc' },
    });

    this.logSuccess('listForUser', { userId: context.userId, count: memories.length });
    return memories.map((m: any) => this.mapMemoryToDto(m));
  }

  /** Single memory detail, scoped to the requesting user. Backs the Memory detail view. */
  async getForUser(context: ApplicationContext, memoryId: string): Promise<MemoryResponseDto> {
    const memory = await this.findOwned(context.userId, memoryId);
    return this.mapMemoryToDto(memory);
  }

  /**
   * Soft delete ("forget this"). Sets deletedAt — the schema's existing
   * soft-delete column — never hard-deletes a single memory; that stays
   * reserved for full account deletion.
   */
  async forgetForUser(context: ApplicationContext, memoryId: string): Promise<void> {
    await this.findOwned(context.userId, memoryId);
    await this.memoryRepository.softDelete(memoryId);
    this.logSuccess('forgetForUser', { userId: context.userId, memoryId });
  }

  private async findOwned(userId: string, memoryId: string) {
    const memory = await this.memoryRepository.findById(memoryId);
    if (!memory) {
      throw new NotFoundError('Memory');
    }
    if (memory.userId !== userId) {
      throw new ForbiddenError('You do not have access to this memory');
    }
    return memory;
  }

  private mapMemoryToDto(memory: any): MemoryResponseDto {
    return {
      id: memory.id,
      companionId: memory.companionId,
      content: memory.content,
      type: memory.type,
      importance: memory.importance,
      tags: memory.tags || [],
      accessCount: memory.accessCount || 0,
      lastAccessedAt: memory.lastAccessedAt || memory.updatedAt,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
    };
  }
}
