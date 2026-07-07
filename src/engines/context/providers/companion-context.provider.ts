/**
 * CompanionContextProvider — the single source for the companion slice.
 *
 * Talks to the Companion Engine (which itself synchronizes with the World
 * Engine). Required: without the companion's life-state there is no one to
 * converse with. A pre-synchronized world in the request is threaded through so
 * the companion and world slices stay consistent.
 */

import { IResult, Result } from '@services/types/result.type';
import type { ICompanionEngine } from '@engines/companion';
import { CompanionContextSlice, ContextRequest } from '../dtos/conversation-context.dto';
import { ContextProviderKey, IContextProvider } from '../interfaces/context-provider.interface';

export class CompanionContextProvider implements IContextProvider<CompanionContextSlice> {
  readonly key: ContextProviderKey = 'companion';
  readonly required = true;

  constructor(private readonly companionEngine: ICompanionEngine) {}

  emptySlice(): CompanionContextSlice {
    return { available: false };
  }

  async provide(request: ContextRequest): Promise<IResult<CompanionContextSlice>> {
    const result = await this.companionEngine.resolveState({
      companionId: request.companionId,
      referenceDate: request.referenceDate,
      timezone: request.timezone,
      world: request.world,
    });

    if (!result.isSuccess || !result.value) {
      return Result.failure(result.error ?? new Error('Companion unavailable'));
    }

    const snap = result.value;
    return Result.success({
      available: true,
      companionId: snap.companionId,
      name: snap.name,
      displayName: snap.displayName,
      state: snap.state,
      mood: snap.mood,
      expression: snap.expression,
      gesture: snap.gesture,
      location: snap.location,
      outfit: snap.outfit,
      availability: snap.availability,
      timeOfDay: snap.timeOfDay,
    });
  }
}
