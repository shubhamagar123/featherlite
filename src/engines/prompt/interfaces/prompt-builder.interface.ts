import { IResult } from '@services/types/result.type';
import { PromptPackage, PromptBuildContext, PromptSegment } from '../dtos/prompt.dtos';

export interface IPromptBuilder {
  /**
   * Orchestrate the entire prompt building process:
   * 1. Load template
   * 2. Inject context
   * 3. Apply rules
   * 4. Validate
   * 5. Compress
   * 6. Cache
   */
  build(context: PromptBuildContext): Promise<IResult<PromptPackage>>;
}
