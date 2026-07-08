import { IResult, Result } from '@services/types/result.type';
import { IPromptAssemblyStrategy } from '../interfaces/prompt-assembly-strategy.interface';
import { PromptBuildContext, PromptSegment } from '../dtos/prompt.dtos';
import { PromptRole } from '../enums/prompt.enums';

/**
 * EMOTIONAL strategy: adds tone guidance emphasizing empathy, mirroring, and
 * validation.
 */
export class EmotionalAssemblyStrategy implements IPromptAssemblyStrategy {
  async execute(
    _context: PromptBuildContext,
    segments: PromptSegment[]
  ): Promise<IResult<PromptSegment[]>> {
    return Result.success(
      segments.map((s) =>
        s.role === PromptRole.SYSTEM
          ? {
              ...s,
              content: s.content + '\nEmotional stance: mirror mood, validate feelings, avoid problem-solving unless asked.',
            }
          : s
      )
    );
  }
}
