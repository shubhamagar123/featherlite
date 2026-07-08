import { IResult, Result } from '@services/types/result.type';
import { IResponseDetector } from '../interfaces/response-processor.interfaces';
import { ParsedResponse, ResponseProcessingContext, DetectedItem } from '../dtos/response-processor.dtos';
import { DetectionKind } from '../enums/response-processor.enums';

const NOTIFICATION_PATTERNS: RegExp[] = [
  /\b(i'll (message|text|remind) you)\b/i,
  /\b(let me know when|ping you when)\b/i,
  /\b(scheduled|save the date)\b/i,
];

export class NotificationCandidateDetector implements IResponseDetector {
  detect(parsed: ParsedResponse, _ctx: ResponseProcessingContext): IResult<DetectedItem[]> {
    const text = parsed.text ?? '';
    const items: DetectedItem[] = [];
    for (const pattern of NOTIFICATION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        items.push({
          kind: DetectionKind.NOTIFICATION_CANDIDATE,
          confidence: 0.65,
          data: { snippet: match[0] },
          reason: `notification pattern matched: ${pattern.source}`,
        });
      }
    }
    return Result.success(items);
  }
}
