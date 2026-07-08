import { IResult, Result } from '@services/types/result.type';
import { IResponseParser } from '../interfaces/response-processor.interfaces';
import { RawLLMResponse, ParsedResponse } from '../dtos/response-processor.dtos';
import { ResponseFormat } from '../enums/response-processor.enums';

/**
 * Deterministic content parser. Format is respected when explicit, otherwise
 * inferred from surface cues (leading `{`, code fences, tool_call marker).
 * Never throws on malformed content — surfaces failures via the Result monad.
 */
export class ResponseParser implements IResponseParser {
  parse(raw: RawLLMResponse): IResult<ParsedResponse> {
    return Result.try(() => {
      const format = raw.format ?? this.infer(raw.content);
      const trimmed = raw.content.trim();

      switch (format) {
        case ResponseFormat.JSON: {
          const jsonBody = this.stripCodeFences(trimmed);
          const parsed = JSON.parse(jsonBody);
          return {
            requestId: raw.requestId,
            format,
            json: parsed,
            text: raw.content,
          };
        }
        case ResponseFormat.TOOL_CALL: {
          const toolCalls = this.extractToolCalls(trimmed);
          return {
            requestId: raw.requestId,
            format,
            toolCalls,
            text: raw.content,
          };
        }
        case ResponseFormat.MARKDOWN:
        case ResponseFormat.PLAIN_TEXT:
        default: {
          return {
            requestId: raw.requestId,
            format: format ?? ResponseFormat.PLAIN_TEXT,
            text: raw.content,
          };
        }
      }
    });
  }

  private infer(content: string): ResponseFormat {
    const t = content.trim();
    if (!t) return ResponseFormat.PLAIN_TEXT;
    if (t.startsWith('```')) {
      const inner = this.stripCodeFences(t);
      if (inner.trim().startsWith('{')) return ResponseFormat.JSON;
      return ResponseFormat.MARKDOWN;
    }
    if (t.startsWith('{') || t.startsWith('[')) return ResponseFormat.JSON;
    if (/^tool_call\s*:/i.test(t)) return ResponseFormat.TOOL_CALL;
    if (/[#*_>`]/.test(t)) return ResponseFormat.MARKDOWN;
    return ResponseFormat.PLAIN_TEXT;
  }

  private stripCodeFences(content: string): string {
    const match = content.match(/^```(?:json|markdown|text)?\s*([\s\S]*?)```$/i);
    return match ? match[1].trim() : content;
  }

  private extractToolCalls(content: string): Array<{ name: string; arguments: Record<string, unknown> }> {
    const calls: Array<{ name: string; arguments: Record<string, unknown> }> = [];
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (const line of lines) {
      const m = line.match(/^tool_call\s*:\s*([a-zA-Z0-9_]+)\s*\((.*)\)\s*$/);
      if (!m) continue;
      const name = m[1];
      let args: Record<string, unknown> = {};
      const body = m[2].trim();
      if (body) {
        try {
          args = JSON.parse(body.startsWith('{') ? body : `{${body}}`);
        } catch {
          args = { raw: body };
        }
      }
      calls.push({ name, arguments: args });
    }
    return calls;
  }
}
