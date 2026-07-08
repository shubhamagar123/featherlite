import { IResult, Result } from '@services/types/result.type';
import { IResponseDetector } from '../interfaces/response-processor.interfaces';
import { ParsedResponse, ResponseProcessingContext, DetectedItem } from '../dtos/response-processor.dtos';
import { DetectionKind } from '../enums/response-processor.enums';

const AFFECTION_UP = /\b(care|love|adore|appreciate|grateful|hug)\b/i;
const TRUST_UP = /\b(trust|honest|open|understand)\b/i;
const CONFLICT = /\b(fight|argue|angry|frustrated|hurt)\b/i;

export class RelationshipUpdateDetector implements IResponseDetector {
  detect(parsed: ParsedResponse, _ctx: ResponseProcessingContext): IResult<DetectedItem[]> {
    const text = parsed.text ?? '';
    const items: DetectedItem[] = [];

    if (AFFECTION_UP.test(text)) {
      items.push({
        kind: DetectionKind.RELATIONSHIP_UPDATE,
        confidence: 0.6,
        data: { dimension: 'affection', direction: 'up' },
        reason: 'affection increase signal',
      });
    }
    if (TRUST_UP.test(text)) {
      items.push({
        kind: DetectionKind.RELATIONSHIP_UPDATE,
        confidence: 0.55,
        data: { dimension: 'trust', direction: 'up' },
        reason: 'trust increase signal',
      });
    }
    if (CONFLICT.test(text)) {
      items.push({
        kind: DetectionKind.RELATIONSHIP_UPDATE,
        confidence: 0.55,
        data: { dimension: 'affection', direction: 'down' },
        reason: 'conflict signal',
      });
    }

    return Result.success(items);
  }
}
