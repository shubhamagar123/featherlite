import { IResult, Result } from '@services/types/result.type';
import { IPromptAssemblyStrategy } from '../interfaces/prompt-assembly-strategy.interface';
import { PromptBuildContext, PromptSegment } from '../dtos/prompt.dtos';
import { PromptRole } from '../enums/prompt.enums';

/**
 * CONCISE strategy: tells the model to keep replies short. Adds a brevity
 * directive to the developer/system layer without changing user turn.
 */
export class ConciseAssemblyStrategy implements IPromptAssemblyStrategy {
  async execute(
    _context: PromptBuildContext,
    segments: PromptSegment[]
  ): Promise<IResult<PromptSegment[]>> {
    return Result.success(
      segments.map((s) =>
        s.role === PromptRole.DEVELOPER || s.role === PromptRole.SYSTEM
          ? { ...s, content: s.content + '\nStyle: reply in ≤3 sentences.' }
          : s
      )
    );
  }
}
