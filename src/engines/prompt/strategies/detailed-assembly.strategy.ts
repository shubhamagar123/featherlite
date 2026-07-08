import { IResult, Result } from '@services/types/result.type';
import { IPromptAssemblyStrategy } from '../interfaces/prompt-assembly-strategy.interface';
import { PromptBuildContext, PromptSegment } from '../dtos/prompt.dtos';
import { PromptRole } from '../enums/prompt.enums';

/**
 * DETAILED strategy: prepends a "Full-context reasoning" hint into the system
 * segment so the model is instructed to consider all provided context.
 */
export class DetailedAssemblyStrategy implements IPromptAssemblyStrategy {
  async execute(
    _context: PromptBuildContext,
    segments: PromptSegment[]
  ): Promise<IResult<PromptSegment[]>> {
    return Result.success(
      segments.map((s) =>
        s.role === PromptRole.SYSTEM
          ? {
              ...s,
              content: 'Reason through every provided context slice before replying.\n' + s.content,
            }
          : s
      )
    );
  }
}
