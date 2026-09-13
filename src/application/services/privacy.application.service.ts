import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';
import { MemoryRepository } from '@database/repositories/memory.repository';
import { MessageRepository } from '@database/repositories/message.repository';
import { PlannerEventRepository } from '@database/repositories/planner-event.repository';

export interface DataExportDto {
  userId: string;
  generatedAt: string;
  memories: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  plannerEvents: Record<string, unknown>[];
}

/**
 * Privacy Application Service
 * Data export for the "delete anytime" / privacy screen promise.
 *
 * Synchronous by design: at this data volume (per-user memories/messages/
 * planner events, not a platform-wide export) a single query round-trip per
 * table completes well within a normal request timeout, so there is no
 * async-job/queue to build or poll yet. If per-user data volume grows large
 * enough to risk that, this is the seam to swap for a queued job returning
 * a job id instead of changing the endpoint's callers.
 */
export class PrivacyApplicationService extends ApplicationServiceBase {
  private readonly memoryRepository: MemoryRepository;
  private readonly messageRepository: MessageRepository;
  private readonly plannerEventRepository: PlannerEventRepository;

  constructor() {
    super('PrivacyApplicationService');
    this.memoryRepository = new MemoryRepository();
    this.messageRepository = new MessageRepository();
    this.plannerEventRepository = new PlannerEventRepository();
  }

  async exportData(context: ApplicationContext): Promise<DataExportDto> {
    this.logStart('exportData', { userId: context.userId });

    const [memories, messages, plannerEvents] = await Promise.all([
      this.memoryRepository.findByUserId(context.userId),
      this.messageRepository.findByUserId(context.userId),
      this.plannerEventRepository.findByUserId(context.userId),
    ]);

    this.logSuccess('exportData', {
      userId: context.userId,
      memories: memories.length,
      messages: messages.length,
      plannerEvents: plannerEvents.length,
    });

    return {
      userId: context.userId,
      generatedAt: new Date().toISOString(),
      memories: memories as unknown as Record<string, unknown>[],
      messages: messages as unknown as Record<string, unknown>[],
      plannerEvents: plannerEvents as unknown as Record<string, unknown>[],
    };
  }
}
