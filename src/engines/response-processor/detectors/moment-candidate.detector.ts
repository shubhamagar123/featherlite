import { IResult, Result } from '@services/types/result.type';
import { IResponseDetector } from '../interfaces/response-processor.interfaces';
import { ParsedResponse, ResponseProcessingContext, DetectedItem } from '../dtos/response-processor.dtos';
import { DetectionKind } from '../enums/response-processor.enums';

const MOMENT_PATTERNS: RegExp[] = [
  /\bthis is (special|memorable|important)\b/i,
  /\bfirst time (we|you|i)\b/i,
  /\b(celebration|anniversary|milestone)\b/i,
];

export class MomentCandidateDetector implements IResponseDetector {
  detect(parsed: ParsedResponse, _ctx: ResponseProcessingContext): IResult<DetectedItem[]> {
    const text = parsed.text ?? '';
    const items: DetectedItem[] = [];
    for (const pattern of MOMENT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        items.push({
          kind: DetectionKind.MOMENT_CANDIDATE,
          confidence: 0.7,
          data: { snippet: match[0] },
          reason: `moment pattern matched: ${pattern.source}`,
        });
      }
    }
    return Result.success(items);
  }
}
