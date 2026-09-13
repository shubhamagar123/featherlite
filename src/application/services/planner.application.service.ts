import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';
import { ForbiddenError, NotFoundError } from '@utils/error';
import { PlannerEventRepository } from '@database/repositories/planner-event.repository';
import type { PlannerEvent } from '@prisma/client';

export interface PlannerEventDto {
  id: string;
  userId: string;
  companionId: string | null;
  title: string;
  description: string | null;
  scheduledFor: Date;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlannerEventInput {
  companionId?: string;
  title: string;
  description?: string;
  scheduledFor: Date;
  metadata?: Record<string, unknown>;
}

export interface UpdatePlannerEventInput {
  title?: string;
  description?: string;
  scheduledFor?: Date;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  metadata?: Record<string, unknown>;
}

/**
 * Planner Application Service
 * CRUD for user-scheduled planner events. Thin wrapper over
 * PlannerEventRepository — there is no separate business-logic engine for
 * this yet, matching how AuthApplicationService talks to UserRepository
 * directly.
 */
export class PlannerApplicationService extends ApplicationServiceBase {
  private readonly repository: PlannerEventRepository;

  constructor() {
    super('PlannerApplicationService');
    this.repository = new PlannerEventRepository();
  }

  async create(context: ApplicationContext, input: CreatePlannerEventInput): Promise<PlannerEventDto> {
    this.logStart('create', { userId: context.userId });

    const event = await this.repository.create({
      user: { connect: { id: context.userId } },
      ...(input.companionId && { companion: { connect: { id: input.companionId } } }),
      title: input.title,
      description: input.description,
      scheduledFor: input.scheduledFor,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    } as any);

    this.logSuccess('create', { userId: context.userId, eventId: event.id });
    return this.toDto(event);
  }

  async list(context: ApplicationContext, limit = 50): Promise<PlannerEventDto[]> {
    const events = await this.repository.findByUserId(context.userId, {
      take: limit,
      orderBy: { scheduledFor: 'asc' },
    });
    return events.map((e) => this.toDto(e));
  }

  async getById(context: ApplicationContext, eventId: string): Promise<PlannerEventDto> {
    const event = await this.findOwned(context.userId, eventId);
    return this.toDto(event);
  }

  async update(
    context: ApplicationContext,
    eventId: string,
    patch: UpdatePlannerEventInput
  ): Promise<PlannerEventDto> {
    await this.findOwned(context.userId, eventId);

    const updated = await this.repository.update(eventId, {
      title: patch.title,
      description: patch.description,
      scheduledFor: patch.scheduledFor,
      status: patch.status,
      metadata: patch.metadata ? JSON.stringify(patch.metadata) : undefined,
    } as any);

    this.logSuccess('update', { userId: context.userId, eventId });
    return this.toDto(updated);
  }

  async delete(context: ApplicationContext, eventId: string): Promise<void> {
    await this.findOwned(context.userId, eventId);
    await this.repository.softDelete(eventId);
    this.logSuccess('delete', { userId: context.userId, eventId });
  }

  /** Loads the event and throws unless the requesting user owns it. */
  private async findOwned(userId: string, eventId: string): Promise<PlannerEvent> {
    const event = await this.repository.findById(eventId);
    if (!event) {
      throw new NotFoundError('PlannerEvent');
    }
    if (event.userId !== userId) {
      throw new ForbiddenError('You do not have access to this planner event');
    }
    return event;
  }

  private toDto(event: PlannerEvent): PlannerEventDto {
    return {
      id: event.id,
      userId: event.userId,
      companionId: event.companionId,
      title: event.title,
      description: event.description,
      scheduledFor: event.scheduledFor,
      status: event.status,
      metadata: event.metadata ? JSON.parse(event.metadata) : null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
