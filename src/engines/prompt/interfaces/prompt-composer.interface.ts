import { IResult } from '@services/types/result.type';
import { PromptPayload, PromptBuildContext } from '../dtos/prompt.dtos';

export interface IPromptComposer {
  /**
   * Compose the entire prompt construction process:
   * 1. Load template
   * 2. Inject context
   * 3. Apply rules
   * 4. Validate
   * 5. Compress
   * 6. Cache
   */
  compose(context: PromptBuildContext): Promise<IResult<PromptPayload>>;
}
