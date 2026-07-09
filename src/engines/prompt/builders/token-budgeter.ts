import { encodingForModel, TiktokenModel } from 'js-tiktoken';
import { PromptSegment } from '../dtos/prompt.dtos';

export type TokenizerModel = TiktokenModel | 'unknown';

/**
 * Model-aware token budgeter using real tokenizers for OpenAI/Anthropic models.
 * Falls back to char/4 for unknown models.
 */
export class TokenBudgeter {
  private encodingCache: Map<TokenizerModel, ReturnType<typeof encodingForModel>> = new Map();

  /**
   * Estimate tokens for text using real tokenizer if available, else char/4 fallback.
   * @param text Text to estimate tokens for
   * @param model Optional model name for tokenizer selection (e.g., 'gpt-4', 'claude-3-sonnet')
   */
  estimate(text: string, model?: TokenizerModel): number {
    if (!text) return 0;

    const encoding = this.getEncoding(model);
    if (!encoding) {
      return Math.ceil(text.length / 4);
    }

    try {
      const tokens = encoding.encode(text);
      return tokens.length;
    } catch {
      // If encoding fails, fall back to char/4
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Detect model from provider type and model name.
   * Maps provider models to tiktoken-compatible model names.
   */
  detectModel(provider?: string, modelName?: string): TokenizerModel | undefined {
    if (!modelName) return undefined;

    const lowerModel = modelName.toLowerCase();

    if (provider === 'OPENAI' || lowerModel.includes('gpt')) {
      if (lowerModel.includes('4-turbo') || lowerModel.includes('4-1106') || lowerModel.includes('4-0125')) {
        return 'gpt-4-turbo';
      }
      if (lowerModel.includes('4o-2024')) {
        return 'gpt-4o';
      }
      if (lowerModel.includes('4o')) {
        return 'gpt-4o';
      }
      if (lowerModel.includes('4')) {
        return 'gpt-4';
      }
      if (lowerModel.includes('3.5')) {
        return 'gpt-3.5-turbo';
      }
    }

    if (provider === 'CLAUDE' || lowerModel.includes('claude')) {
      if (lowerModel.includes('3-haiku') || lowerModel.includes('haiku')) {
        return 'gpt-4';
      }
      if (lowerModel.includes('3-sonnet') || lowerModel.includes('sonnet')) {
        return 'gpt-4';
      }
      if (lowerModel.includes('3-opus') || lowerModel.includes('opus')) {
        return 'gpt-4';
      }
    }

    return undefined;
  }

  private getEncoding(model?: TokenizerModel) {
    if (!model) return null;

    if (this.encodingCache.has(model)) {
      return this.encodingCache.get(model)!;
    }

    try {
      const encoding = encodingForModel(model as TiktokenModel);
      this.encodingCache.set(model, encoding);
      return encoding;
    } catch {
      return null;
    }
  }

  segmentTokens(segments: PromptSegment[], model?: TokenizerModel): number {
    return segments.reduce((sum, s) => sum + (s.tokenCount ?? this.estimate(s.content, model)), 0);
  }

  headroom(segments: PromptSegment[], maxTokens: number, model?: TokenizerModel): number {
    return Math.max(0, maxTokens - this.segmentTokens(segments, model));
  }

  fitsBudget(segments: PromptSegment[], maxTokens: number, model?: TokenizerModel): boolean {
    return this.segmentTokens(segments, model) <= maxTokens;
  }

  annotate(segments: PromptSegment[], model?: TokenizerModel): PromptSegment[] {
    return segments.map((s) => ({ ...s, tokenCount: s.tokenCount ?? this.estimate(s.content, model) }));
  }
}
