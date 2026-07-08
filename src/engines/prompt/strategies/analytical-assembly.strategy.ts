import { IResult, Result } from '@services/types/result.type';
import { IPromptAssemblyStrategy } from '../interfaces/prompt-assembly-strategy.interface';
import { PromptBuildContext, PromptSegment } from '../dtos/prompt.dtos';
import { PromptRole } from '../enums/prompt.enums';

/**
 * ANALYTICAL strategy: routes the model to structured output. Used by memory
 * extraction, safety checks, and other machine-consumed prompts.
 */
export class AnalyticalAssemblyStrategy implements IPromptAssemblyStrategy {
  async execute(
    _context: PromptBuildContext,
    segments: PromptSegment[]
  ): Promise<IResult<PromptSegment[]>> {
    return Result.success(
      segments.map((s) =>
        s.role === PromptRole.DEVELOPER
          ? { ...s, content: s.content + '\nAlways return valid JSON. No prose.' }
          : s
      )
    );
  }
}
