import { NudgePreference, Prisma } from '@prisma/client';
import { BaseRepository } from '../repository.base';
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

  async findByUserId(userId: string): Promise<NudgePreference | null> {
    return this.findOne({ userId });
  }
}
