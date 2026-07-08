import { IResult, Result } from '@services/types/result.type';
import { IResponseValidator } from '../interfaces/response-processor.interfaces';
import {
  ParsedResponse,
  ResponseValidationIssue,
  ResponseValidationOutcome,
  ResponseProcessingContext,
} from '../dtos/response-processor.dtos';
import { ResponseFormat, ResponseValidationSeverity } from '../enums/response-processor.enums';

/**
 * Structural validator. Verifies the parsed response matches its expected
 * format and (when a schema is provided) contains required top-level keys.
 */
export class SchemaValidator implements IResponseValidator {
  validate(parsed: ParsedResponse, ctx: ResponseProcessingContext): IResult<ResponseValidationOutcome> {
    const issues: ResponseValidationIssue[] = [];

    if (ctx.expectedFormat && parsed.format !== ctx.expectedFormat) {
      issues.push({
        code: 'FORMAT_MISMATCH',
        severity: ResponseValidationSeverity.BLOCKING,
        message: `Expected format ${ctx.expectedFormat}, got ${parsed.format}`,
      });
    }

    if (parsed.format === ResponseFormat.JSON && parsed.json === undefined) {
      issues.push({
        code: 'JSON_MISSING_BODY',
        severity: ResponseValidationSeverity.BLOCKING,
        message: 'JSON format declared but no parsed body available',
      });
    }

    if (parsed.format === ResponseFormat.TOOL_CALL && (!parsed.toolCalls || parsed.toolCalls.length === 0)) {
      issues.push({
        code: 'TOOL_CALL_EMPTY',
        severity: ResponseValidationSeverity.BLOCKING,
        message: 'Tool call format declared but no tool calls parsed',
      });
    }

    if (ctx.expectedSchema && parsed.format === ResponseFormat.JSON && parsed.json && typeof parsed.json === 'object') {
      const body = parsed.json as Record<string, unknown>;
      for (const [key, spec] of Object.entries(ctx.expectedSchema)) {
        const required = typeof spec === 'object' && spec !== null && 'required' in spec ? (spec as any).required : false;
        if (required && !(key in body)) {
          issues.push({
            code: 'SCHEMA_MISSING_KEY',
            severity: ResponseValidationSeverity.BLOCKING,
            message: `Required key missing: ${key}`,
          });
        }
      }
    }

    const blocking = issues.some((i) => i.severity === ResponseValidationSeverity.BLOCKING);
    return Result.success({ isValid: !blocking, isSafe: true, issues });
  }
}
