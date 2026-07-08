import { IResult } from '@services/types/result.type';
import { PromptPayload, ValidationResult } from '../dtos/prompt.dtos';

export interface IPromptValidationService {
  /**
   * Validate a prompt payload for completeness, safety, and compliance.
   */
  validate(prompt: PromptPayload): IResult<ValidationResult>;
}
