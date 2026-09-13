import { NudgePreference, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type NudgePreferenceCreateInput = Prisma.NudgePreferenceCreateInput;
type NudgePreferenceUpdateInput = Prisma.NudgePreferenceUpdateInput;

export class NudgePreferenceRepository extends BaseRepository<
  NudgePreference,
  NudgePreferenceCreateInput,
  NudgePreferenceUpdateInput
> {
  protected getDelegate() {
    return prisma.nudgePreference;
  }

  protected getModelName(): string {
    return 'NudgePreference';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByUserId(userId: string, options?: FindManyOptions): Promise<NudgePreference[]> {
    return this.findMany({ userId }, options);
  }

  async findByUserIdAndType(userId: string, nudgeType: string): Promise<NudgePreference | null> {
    return this.findOne({ userId, nudgeType });
  }
}
