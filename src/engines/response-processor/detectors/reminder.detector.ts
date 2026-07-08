import { IResult, Result } from '@services/types/result.type';
import { IResponseDetector } from '../interfaces/response-processor.interfaces';
import { ParsedResponse, ResponseProcessingContext, DetectedItem } from '../dtos/response-processor.dtos';
import { DetectionKind } from '../enums/response-processor.enums';

const REMINDER_PATTERN = /\b(remind (me|you) (to|about) ([^.?!\n]+))/i;

export class ReminderDetector implements IResponseDetector {
  detect(parsed: ParsedResponse, _ctx: ResponseProcessingContext): IResult<DetectedItem[]> {
    const text = parsed.text ?? '';
    const items: DetectedItem[] = [];
    const match = text.match(REMINDER_PATTERN);
    if (match) {
      items.push({
        kind: DetectionKind.REMINDER,
        confidence: 0.8,
        data: { subject: match[4]?.trim() ?? '' },
        reason: 'explicit reminder request detected',
      });
    }
    return Result.success(items);
  }
}
