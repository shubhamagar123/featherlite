/**
 * RelationshipContextProvider — the single source for the relationship slice.
 *
 * Depends on the Relationship Engine (not the service directly). Optional:
 * a user/companion pair may have no relationship yet. That *absence* is normal
 * and is mapped to an empty (available: false) slice — not an error.
 * Only an unexpected engine error propagates as a failure (which the builder
 * treats as graceful degradation for an optional provider).
 */

import { IResult, Result } from '@services/types/result.type';
import { NotFoundError } from '@services/exceptions';
import { IRelationshipEngine } from '@engines/relationship';
import { ContextRequest, RelationshipContextSlice } from '../dtos/conversation-context.dto';
import { ContextProviderKey, IContextProvider } from '../interfaces/context-provider.interface';

export class RelationshipContextProvider implements IContextProvider<RelationshipContextSlice> {
  readonly key: ContextProviderKey = 'relationship';
  readonly required = false;

  constructor(private readonly relationshipEngine: IRelationshipEngine) {}

  emptySlice(): RelationshipContextSlice {
    return { available: false };
  }

  async provide(request: ContextRequest): Promise<IResult<RelationshipContextSlice>> {
    const result = await this.relationshipEngine.getSnapshot(
      request.userId,
      request.companionId
    );

    if (result.isSuccess && result.value) {
      const snapshot = result.value;
      return Result.success({
        available: true,
        status: snapshot.status,
        level: snapshot.phase,
        affectionScore: snapshot.overallHealth,
        trustScore: snapshot.dimensions.TRUST?.value ?? 0,
        familiarityScore: snapshot.dimensions.FAMILIARITY?.value ?? 0,
        totalInteractions: 0,
      });
    }

    if (result.error instanceof NotFoundError) {
      return Result.success(this.emptySlice());
    }

    return Result.failure(result.error ?? new Error('Relationship provider failed'));
  }
}
