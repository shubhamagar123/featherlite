import { ResponseValidationOutcome } from '../dtos/response-processor.dtos';
import { ResponseValidationSeverity } from '../enums/response-processor.enums';

/**
 * Combine outcomes from schema + safety validators into a single verdict.
 * Any BLOCKING issue in either validator fails the response; WARNING/INFO only
 * annotate the outcome.
 */
export class ResponseRules {
  merge(outcomes: ResponseValidationOutcome[]): ResponseValidationOutcome {
    const issues = outcomes.flatMap((o) => o.issues);
    const anyBlocking = issues.some((i) => i.severity === ResponseValidationSeverity.BLOCKING);
    return {
      isValid: !anyBlocking,
      isSafe: !issues.some(
        (i) => i.severity === ResponseValidationSeverity.BLOCKING && i.category !== undefined
      ),
      issues,
    };
  }
}
