/**
 * SilenceManager — manages silence/pause interactions.
 */

import { IResult, Result } from '@services/types/result.type';
import { ISilenceManager } from '../interfaces/interaction-manager.interface';
import { SilenceInteraction } from '../dtos/interaction.dtos';

export class SilenceManager implements ISilenceManager {
  async recordSilence(_interaction: SilenceInteraction): Promise<IResult<void>> {
    return Result.success(undefined);
  }

  async analyzeSilence(_interaction: SilenceInteraction): Promise<IResult<Record<string, unknown>>> {
    return Result.failure(new Error('Not implemented'));
  }
}
