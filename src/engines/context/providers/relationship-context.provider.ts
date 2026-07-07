/**
 * RelationshipContextProvider — the single source for the relationship slice.
 *
 * Optional: a user/companion pair may have no relationship yet. That *absence*
 * is normal and is mapped to an empty (available: false) slice — not an error.
 * Only an unexpected service error propagates as a failure (which the builder
 * treats as graceful degradation for an optional provider).
 */

import { IResult, Result } from '@services/types/result.type';
import { IRelationshipService } from '@services/relationship/relationship.service.interface';
import { NotFoundError } from '@services/exceptions';
import { ContextRequest, RelationshipContextSlice } from '../dtos/conversation-context.dto';
import { ContextProviderKey, IContextProvider } from '../interfaces/context-provider.interface';

export class RelationshipContextProvider implements IContextProvider<RelationshipContextSlice> {
  readonly key: ContextProviderKey = 'relationship';
  readonly required = false;

  constructor(private readonly relationshipService: IRelationshipService) {}

  emptySlice(): RelationshipContextSlice {
    return { available: false };
  }

  async provide(request: ContextRequest): Promise<IResult<RelationshipContextSlice>> {
    const result = await this.relationshipService.getRelationshipByUserAndCompanion(
      request.userId,
      request.companionId
    );

    if (result.isSuccess && result.value) {
      const rel = result.value;
      return Result.success({
        available: true,
        status: rel.status,
        level: rel.level,
        affectionScore: rel.affectionScore,
        trustScore: rel.trustScore,
        familiarityScore: rel.familiarityScore,
        totalInteractions: rel.totalInteractions,
      });
    }

    // A missing relationship is a normal state, not a failure.
    if (result.error instanceof NotFoundError) {
      return Result.success(this.emptySlice());
    }

    return Result.failure(result.error ?? new Error('Relationship provider failed'));
  }
}
