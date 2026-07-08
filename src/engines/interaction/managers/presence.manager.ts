/**
 * PresenceManager — handles presence and availability interactions.
 */

import { IResult, Result } from '@services/types/result.type';
import { IPresenceManager } from '../interfaces/interaction-manager.interface';
import { PresenceInteraction } from '../dtos/interaction.dtos';
import type { InteractionContextDTO } from '@engines/context';

export class PresenceManager implements IPresenceManager {
  async updatePresence(
    _interaction: PresenceInteraction,
    _context: InteractionContextDTO
  ): Promise<IResult<void>> {
    return Result.success(undefined);
  }

  async getPresence(
    _userId: string,
    _companionId: string
  ): Promise<IResult<PresenceInteraction>> {
    return Result.failure(new Error('Not implemented'));
  }
}
