/**
 * InterruptionManager — handles interaction interruptions.
 */

import { IResult, Result } from '@services/types/result.type';
import { IInterruptionManager } from '../interfaces/interaction-manager.interface';
import { InterruptionInteraction } from '../dtos/interaction.dtos';

export class InterruptionManager implements IInterruptionManager {
  async handleInterruption(_interaction: InterruptionInteraction): Promise<IResult<void>> {
    return Result.success(undefined);
  }

  async resolveInterruption(_interruptionId: string): Promise<IResult<void>> {
    return Result.success(undefined);
  }
}
