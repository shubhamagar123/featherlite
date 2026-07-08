/**
 * StreamingManager — handles streaming responses.
 */

import { IResult, Result } from '@services/types/result.type';
import { IStreamingManager } from '../interfaces/interaction-manager.interface';
import { StreamingInteraction } from '../dtos/interaction.dtos';
import type { InteractionContextDTO } from '@engines/context';

export class StreamingManager implements IStreamingManager {
  async startStream(
    _interaction: StreamingInteraction,
    _context: InteractionContextDTO
  ): Promise<IResult<void>> {
    return Result.success(undefined);
  }

  async updateStreamState(
    _streamId: string,
    _state: string
  ): Promise<IResult<StreamingInteraction>> {
    return Result.failure(new Error('Not implemented'));
  }

  async endStream(_streamId: string): Promise<IResult<void>> {
    return Result.success(undefined);
  }
}
