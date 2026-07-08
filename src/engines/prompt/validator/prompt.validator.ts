import { IResult, Result } from '@services/types/result.type';
import { IPromptValidationService } from '../interfaces/prompt-validation-service.interface';
import { PromptPayload, ValidationResult } from '../dtos/prompt.dtos';
import { RuleSeverity } from '../enums/prompt.enums';

const UNRESOLVED_PLACEHOLDER = /\{\{[A-Z0-9_]+\}\}/;

export class PromptValidator implements IPromptValidationService {
  validate(prompt: PromptPayload): IResult<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const rulesViolated: string[] = [];

    if (!prompt.systemPrompt || !prompt.systemPrompt.content.trim()) {
      errors.push('systemPrompt is empty');
    }
    if (!prompt.userPrompt || !prompt.userPrompt.content.trim()) {
      errors.push('userPrompt is empty');
    }

    const combined =
      prompt.systemPrompt.content +
      (prompt.developerPrompt?.content ?? '') +
      prompt.userPrompt.content;

    if (UNRESOLVED_PLACEHOLDER.test(combined)) {
      warnings.push('prompt contains unresolved {{PLACEHOLDER}} tokens');
    }

    // Enforce critical rule presence.
    for (const rule of prompt.rules) {
      if (rule.priority >= 100 && !prompt.systemPrompt.content.includes(rule.statement)) {
        // Critical rule statement missing from system prompt.
        rulesViolated.push(rule.id);
      }
    }

    if (prompt.totalTokens <= 0) {
      warnings.push('totalTokens not computed');
    }

    // Token overflow is a warning, not an error (compressor may run after this).
    if (prompt.expiresAt && prompt.expiresAt.getTime() < Date.now()) {
      warnings.push('prompt marked as already expired');
    }

    const isValid = errors.length === 0 && rulesViolated.length === 0;
    return Result.success({ isValid, errors, warnings, rulesViolated });
  }
}

export { RuleSeverity };
