import { IResult, Result } from '@services/types/result.type';
import { IPromptAssemblyStrategy } from '../interfaces/prompt-assembly-strategy.interface';
import { PromptBuildContext, PromptSegment } from '../dtos/prompt.dtos';

/**
 * STANDARD ordering: system, developer, user. Order-preserving. Strategy-specific
 * transforms are additive (they set an `order` field) so the composer can rely
 * on stable ordering downstream.
 */
export class StandardAssemblyStrategy implements IPromptAssemblyStrategy {
  async execute(
    _context: PromptBuildContext,
    segments: PromptSegment[]
  ): Promise<IResult<PromptSegment[]>> {
    const ordered = [...segments].sort((a, b) => a.order - b.order);
    return Result.success(ordered);
  }
}
