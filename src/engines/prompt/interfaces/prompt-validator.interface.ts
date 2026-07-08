import { IResult } from '@services/types/result.type';
import { PromptPackage, ValidationResult } from '../dtos/prompt.dtos';

export interface IPromptValidator {
  /**
   * Validate a prompt package for completeness, safety, and compliance.
   */
  validate(prompt: PromptPackage): IResult<ValidationResult>;
}
