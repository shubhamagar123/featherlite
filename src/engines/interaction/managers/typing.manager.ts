/**
 * TypingManager — detects and reports typing activity.
 */

import { IResult, Result } from '@services/types/result.type';
import { ITypingManager } from '../interfaces/interaction-manager.interface';
import { TypingInteraction } from '../dtos/interaction.dtos';

export class TypingManager implements ITypingManager {
  async reportTyping(_interaction: TypingInteraction): Promise<IResult<void>> {
    return Result.success(undefined);
  }
}
