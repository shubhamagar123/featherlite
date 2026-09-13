import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';
import { ConflictError, ForbiddenError, NotFoundError } from '@utils/error';
import { NudgePreferenceRepository } from '@database/repositories/nudge-preference.repository';
import type { NudgePreference } from '@prisma/client';

export interface NudgePreferenceDto {
  id: string;
  userId: string;
  nudgeType: string;
  enabled: boolean;
  frequency: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNudgePreferenceInput {
  nudgeType: string;
  enabled?: boolean;
  frequency?: 'IMMEDIATE' | 'DAILY' | 'WEEKLY';
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface UpdateNudgePreferenceInput {
  enabled?: boolean;
  frequency?: 'IMMEDIATE' | 'DAILY' | 'WEEKLY';
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

/**
 * Nudge Application Service
 * CRUD for per-user, per-nudge-type delivery preferences. Thin wrapper over
 * NudgePreferenceRepository, mirroring PlannerApplicationService.
 */
export class NudgeApplicationService extends ApplicationServiceBase {
  private readonly repository: NudgePreferenceRepository;

  constructor() {
    super('NudgeApplicationService');
    this.repository = new NudgePreferenceRepository();
  }

  async create(
    context: ApplicationContext,
    input: CreateNudgePreferenceInput
  ): Promise<NudgePreferenceDto> {
    this.logStart('create', { userId: context.userId, nudgeType: input.nudgeType });

    const existing = await this.repository.findByUserIdAndType(context.userId, input.nudgeType);
    if (existing) {
      throw new ConflictError(`Nudge preference for "${input.nudgeType}" already exists`);
    }

    const created = await this.repository.create({
      user: { connect: { id: context.userId } },
      nudgeType: input.nudgeType,
      enabled: input.enabled ?? true,
      frequency: input.frequency ?? 'DAILY',
      quietHoursStart: input.quietHoursStart,
      quietHoursEnd: input.quietHoursEnd,
    } as any);

    this.logSuccess('create', { userId: context.userId, id: created.id });
    return this.toDto(created);
  }

  async list(context: ApplicationContext): Promise<NudgePreferenceDto[]> {
    const preferences = await this.repository.findByUserId(context.userId);
    return preferences.map((p) => this.toDto(p));
  }

  async getById(context: ApplicationContext, id: string): Promise<NudgePreferenceDto> {
    const preference = await this.findOwned(context.userId, id);
    return this.toDto(preference);
  }

  async update(
    context: ApplicationContext,
    id: string,
    patch: UpdateNudgePreferenceInput
  ): Promise<NudgePreferenceDto> {
    await this.findOwned(context.userId, id);

    const updated = await this.repository.update(id, {
      enabled: patch.enabled,
      frequency: patch.frequency,
      quietHoursStart: patch.quietHoursStart,
      quietHoursEnd: patch.quietHoursEnd,
    } as any);

    this.logSuccess('update', { userId: context.userId, id });
    return this.toDto(updated);
  }

  async delete(context: ApplicationContext, id: string): Promise<void> {
    await this.findOwned(context.userId, id);
    await this.repository.softDelete(id);
    this.logSuccess('delete', { userId: context.userId, id });
  }

  private async findOwned(userId: string, id: string): Promise<NudgePreference> {
    const preference = await this.repository.findById(id);
    if (!preference) {
      throw new NotFoundError('NudgePreference');
    }
    if (preference.userId !== userId) {
      throw new ForbiddenError('You do not have access to this nudge preference');
    }
    return preference;
  }

  private toDto(preference: NudgePreference): NudgePreferenceDto {
    return {
      id: preference.id,
      userId: preference.userId,
      nudgeType: preference.nudgeType,
      enabled: preference.enabled,
      frequency: preference.frequency,
      quietHoursStart: preference.quietHoursStart,
      quietHoursEnd: preference.quietHoursEnd,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  }
}
