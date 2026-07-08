import { IResult, Result } from '@services/types/result.type';
import { IResponseDetector } from '../interfaces/response-processor.interfaces';
import { ParsedResponse, ResponseProcessingContext, DetectedItem } from '../dtos/response-processor.dtos';
import { DetectionKind, ResponseFormat } from '../enums/response-processor.enums';

/**
 * Emits a memory candidate when the assistant states a durable fact about the
 * user (favorites, home city, family, occupation, etc.). Extraction is left to
 * the Memory Extraction Engine; this detector only signals candidacy.
 */
const DURABLE_FACT_PATTERNS: RegExp[] = [
  /\byou (love|hate|prefer|enjoy|like|dislike|are allergic to) ([^.?!\n]+)/i,
  /\byour (name|birthday|hometown|favorite|partner|kids|job|role) is ([^.?!\n]+)/i,
  /\bi'll remember that\b/i,
];

export class MemoryCandidateDetector implements IResponseDetector {
  detect(parsed: ParsedResponse, _ctx: ResponseProcessingContext): IResult<DetectedItem[]> {
    const items: DetectedItem[] = [];

    // JSON responses may explicitly declare memory candidates.
    if (parsed.format === ResponseFormat.JSON && Array.isArray(parsed.json)) {
      for (const entry of parsed.json as Array<Record<string, unknown>>) {
        if (entry && typeof entry === 'object' && 'content' in entry) {
          items.push({
            kind: DetectionKind.MEMORY_CANDIDATE,
            confidence: 0.95,
            data: entry,
            reason: 'structured memory candidate in JSON response',
          });
        }
      }
      return Result.success(items);
    }

    const text = parsed.text ?? '';
    for (const pattern of DURABLE_FACT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        items.push({
          kind: DetectionKind.MEMORY_CANDIDATE,
          confidence: 0.6,
          data: { snippet: match[0].trim() },
          reason: `durable-fact pattern matched: ${pattern.source}`,
        });
      }
    }

    return Result.success(items);
  }
}
