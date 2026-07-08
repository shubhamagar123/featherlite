import { PromptSegment } from '../dtos/prompt.dtos';

export class TokenBudgeter {
  /** Deterministic 1-token-per-4-characters estimator, matching gateway defaults. */
  estimate(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  segmentTokens(segments: PromptSegment[]): number {
    return segments.reduce((sum, s) => sum + (s.tokenCount ?? this.estimate(s.content)), 0);
  }

  headroom(segments: PromptSegment[], maxTokens: number): number {
    return Math.max(0, maxTokens - this.segmentTokens(segments));
  }

  fitsBudget(segments: PromptSegment[], maxTokens: number): boolean {
    return this.segmentTokens(segments) <= maxTokens;
  }

  annotate(segments: PromptSegment[]): PromptSegment[] {
    return segments.map((s) => ({ ...s, tokenCount: s.tokenCount ?? this.estimate(s.content) }));
  }
}
