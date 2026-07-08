/**
 * ActivityManager — handles companion activity interactions.
 */

import { IResult, Result } from '@services/types/result.type';
import { IActivityManager } from '../interfaces/interaction-manager.interface';
import { ActivityInteraction } from '../dtos/interaction.dtos';
import type { InteractionContextDTO } from '@engines/context';

export class ActivityManager implements IActivityManager {
  async startActivity(
    _interaction: ActivityInteraction,
    _context: InteractionContextDTO
  ): Promise<IResult<void>> {
    return Result.success(undefined);
  }

  async updateActivityProgress(
    _activityId: string,
    _progress: number
  ): Promise<IResult<ActivityInteraction>> {
    return Result.failure(new Error('Not implemented'));
  }

  async completeActivity(_activityId: string): Promise<IResult<ActivityInteraction>> {
    return Result.failure(new Error('Not implemented'));
  }
}
