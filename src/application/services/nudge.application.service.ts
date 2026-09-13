import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';
import { NudgePreferenceRepository } from '@database/repositories/nudge-preference.repository';
import type { NudgePreference } from '@prisma/client';

export interface NudgePreferenceDto {
  careHydration: boolean;
  peopleToRemember: boolean;
  checkingIn: boolean;
  updatedAt: Date;
}

export interface UpdateNudgePreferenceInput {
  careHydration?: boolean;
  peopleToRemember?: boolean;
  checkingIn?: boolean;
}

const DEFAULTS: Pick<NudgePreferenceDto, 'careHydration' | 'peopleToRemember' | 'checkingIn'> = {
  careHydration: true,
  peopleToRemember: true,
  checkingIn: true,
};

/**
 * Nudge Application Service
 * Get/update a single per-user row of simple boolean toggles — one per
 * nudge category (care_hydration, people_to_remember, checking_in), matching
 * the three categories on the product's Notification Preferences screen.
 * No frequency/quiet-hours sub-settings in this pass.
 */
export class NudgeApplicationService extends ApplicationServiceBase {
  private readonly repository: NudgePreferenceRepository;

  constructor() {
    super('NudgeApplicationService');
    this.repository = new NudgePreferenceRepository();
  }

  /** Returns the user's preferences, defaulted (not persisted) if none exist yet. */
  async get(context: ApplicationContext): Promise<NudgePreferenceDto> {
    this.logStart('get', { userId: context.userId });

    const preference = await this.repository.findByUserId(context.userId);
    if (!preference) {
      return { ...DEFAULTS, updatedAt: new Date() };
    }

    this.logSuccess('get', { userId: context.userId });
    return this.toDto(preference);
  }

  /** Creates the row with defaults + patch if it doesn't exist yet, otherwise updates it. */
  async update(
    context: ApplicationContext,
    patch: UpdateNudgePreferenceInput
  ): Promise<NudgePreferenceDto> {
    this.logStart('update', { userId: context.userId });

    const existing = await this.repository.findByUserId(context.userId);

    const result = existing
      ? await this.repository.update(existing.id, {
          careHydration: patch.careHydration,
          peopleToRemember: patch.peopleToRemember,
          checkingIn: patch.checkingIn,
        } as any)
      : await this.repository.create({
          user: { connect: { id: context.userId } },
          careHydration: patch.careHydration ?? DEFAULTS.careHydration,
          peopleToRemember: patch.peopleToRemember ?? DEFAULTS.peopleToRemember,
          checkingIn: patch.checkingIn ?? DEFAULTS.checkingIn,
        } as any);

    this.logSuccess('update', { userId: context.userId });
    return this.toDto(result);
  }

  private toDto(preference: NudgePreference): NudgePreferenceDto {
    return {
      careHydration: preference.careHydration,
      peopleToRemember: preference.peopleToRemember,
      checkingIn: preference.checkingIn,
      updatedAt: preference.updatedAt,
    };
  }
}
