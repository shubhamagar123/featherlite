/**
 * MomentsContextProvider — the single source for the moments slice.
 *
 * Optional: it pulls the companion's recent shared moments. An empty result is a
 * known-empty slice; only a genuine service error propagates as a failure for
 * the builder to degrade.
 */

import { IResult, Result } from '@services/types/result.type';
import { IMomentService } from '@services/moment/moment.service.interface';
import { ContextRequest, MomentsContextSlice } from '../dtos/conversation-context.dto';
import { ContextProviderKey, IContextProvider } from '../interfaces/context-provider.interface';

const DEFAULT_MOMENT_LIMIT = 5;

export class MomentsContextProvider implements IContextProvider<MomentsContextSlice> {
  readonly key: ContextProviderKey = 'moments';
  readonly required = false;

  constructor(private readonly momentService: IMomentService) {}

  emptySlice(): MomentsContextSlice {
    return { available: false, count: 0, items: [] };
  }

  async provide(request: ContextRequest): Promise<IResult<MomentsContextSlice>> {
    const limit = request.limits?.moments ?? DEFAULT_MOMENT_LIMIT;
    const result = await this.momentService.getMomentsByCompanionId(request.companionId, limit);

    if (!result.isSuccess || !result.value) {
      return Result.failure(result.error ?? new Error('Moments provider failed'));
    }

    const items = result.value.map((moment) => ({
      id: moment.id,
      title: moment.title,
      description: moment.description,
      significance: moment.significance,
      occurredAt: moment.occurredAt.toISOString(),
    }));

    return Result.success({ available: true, count: items.length, items });
  }
}
