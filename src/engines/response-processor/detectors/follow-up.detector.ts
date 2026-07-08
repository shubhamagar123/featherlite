import { IResult, Result } from '@services/types/result.type';
import { IResponseDetector } from '../interfaces/response-processor.interfaces';
import { ParsedResponse, ResponseProcessingContext, DetectedItem } from '../dtos/response-processor.dtos';
import { DetectionKind } from '../enums/response-processor.enums';

const FOLLOW_UP_PATTERNS: RegExp[] = [
  /\b(later|tomorrow|next time|next week|catch up|check in)\b/i,
  /\?\s*$/m,
  /\b(would you like|shall we|want me to)\b/i,
];

export class FollowUpDetector implements IResponseDetector {
  detect(parsed: ParsedResponse, _ctx: ResponseProcessingContext): IResult<DetectedItem[]> {
    const text = parsed.text ?? '';
    const items: DetectedItem[] = [];
    for (const pattern of FOLLOW_UP_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        items.push({
          kind: DetectionKind.FOLLOW_UP,
          confidence: 0.7,
          data: { snippet: match[0] },
          reason: `follow-up pattern matched: ${pattern.source}`,
        });
        break;
      }
    }
    return Result.success(items);
  }
}
