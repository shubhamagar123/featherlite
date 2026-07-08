import { IResult, Result } from '@services/types/result.type';
import { IResponseValidator } from '../interfaces/response-processor.interfaces';
import {
  ParsedResponse,
  ResponseValidationIssue,
  ResponseValidationOutcome,
  ResponseProcessingContext,
} from '../dtos/response-processor.dtos';
import { ResponseValidationSeverity, SafetyCategory } from '../enums/response-processor.enums';

interface SafetyPattern {
  category: SafetyCategory;
  pattern: RegExp;
  severity: ResponseValidationSeverity;
  code: string;
}

const SAFETY_PATTERNS: SafetyPattern[] = [
  {
    category: SafetyCategory.SELF_HARM,
    pattern: /\b(kill (myself|yourself)|end my life|suicide)\b/i,
    severity: ResponseValidationSeverity.BLOCKING,
    code: 'SAFETY_SELF_HARM',
  },
  {
    category: SafetyCategory.VIOLENCE,
    pattern: /\b(how to (kill|harm|attack) (a|the) person)\b/i,
    severity: ResponseValidationSeverity.BLOCKING,
    code: 'SAFETY_VIOLENCE',
  },
  {
    category: SafetyCategory.HATE,
    pattern: /\b(subhuman|inferior race|slur[s]?)\b/i,
    severity: ResponseValidationSeverity.BLOCKING,
    code: 'SAFETY_HATE',
  },
  {
    category: SafetyCategory.SEXUAL,
    pattern: /\bexplicit sexual content\b/i,
    severity: ResponseValidationSeverity.WARNING,
    code: 'SAFETY_SEXUAL',
  },
  {
    category: SafetyCategory.ILLEGAL,
    pattern: /\b(how to (make|build) a (bomb|weapon)|meth (recipe|synthesis))\b/i,
    severity: ResponseValidationSeverity.BLOCKING,
    code: 'SAFETY_ILLEGAL',
  },
  {
    category: SafetyCategory.MEDICAL_ADVICE,
    pattern: /\b(diagnose|dose|treatment plan)\b/i,
    severity: ResponseValidationSeverity.WARNING,
    code: 'SAFETY_MEDICAL_ADVICE',
  },
  {
    category: SafetyCategory.LEGAL_ADVICE,
    pattern: /\b(sue|lawsuit|legal advice)\b/i,
    severity: ResponseValidationSeverity.INFO,
    code: 'SAFETY_LEGAL_ADVICE',
  },
  {
    category: SafetyCategory.FINANCIAL_ADVICE,
    pattern: /\b(invest in|financial advice|guaranteed returns)\b/i,
    severity: ResponseValidationSeverity.WARNING,
    code: 'SAFETY_FINANCIAL_ADVICE',
  },
  {
    category: SafetyCategory.PRIVACY_LEAK,
    pattern: /\b(ssn|social security|credit card number)\b/i,
    severity: ResponseValidationSeverity.BLOCKING,
    code: 'SAFETY_PRIVACY',
  },
];

export class SafetyValidator implements IResponseValidator {
  validate(parsed: ParsedResponse, _ctx: ResponseProcessingContext): IResult<ResponseValidationOutcome> {
    const text = parsed.text ?? '';
    const issues: ResponseValidationIssue[] = [];

    for (const p of SAFETY_PATTERNS) {
      const match = text.match(p.pattern);
      if (!match) continue;
      issues.push({
        code: p.code,
        severity: p.severity,
        category: p.category,
        message: `Safety pattern matched: ${p.category}`,
        span: match.index !== undefined ? { start: match.index, end: match.index + match[0].length } : undefined,
      });
    }

    const blocking = issues.some((i) => i.severity === ResponseValidationSeverity.BLOCKING);
    return Result.success({ isValid: !blocking, isSafe: !blocking, issues });
  }
}
