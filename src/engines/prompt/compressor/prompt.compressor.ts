import { IResult, Result } from '@services/types/result.type';
import { IPromptCompressor } from '../interfaces/prompt-compressor.interface';
import { PromptPayload, CompressionStatistics } from '../dtos/prompt.dtos';
import { CompressionLevel, CompressionStrategy, PromptType } from '../enums/prompt.enums';
import { TokenBudgeter } from '../builders/token-budgeter';

/**
 * Losslessly then lossily shrinks a payload to fit a token budget.
 *
 * The compressor operates layer by layer, applying only what is necessary:
 *   1. Whitespace/dedup collapse (always safe).
 *   2. Truncate longest optional segment(s) (moderate/aggressive).
 *   3. Summarize / drop repeated context lines (aggressive).
 */
export class PromptCompressor implements IPromptCompressor {
  private readonly budgeter = new TokenBudgeter();

  async compress(
    prompt: PromptPayload,
    maxTokens: number,
    level: CompressionLevel,
    promptType?: PromptType
  ): Promise<IResult<{ prompt: PromptPayload; stats: CompressionStatistics }>> {
    try {
      const strategy = this.selectStrategy(promptType);
      const originalLength = this.length(prompt);
      const segmentsAffected: string[] = [];

      if (level === CompressionLevel.NONE || this.tokens(prompt) <= maxTokens) {
        return Result.success({
          prompt: this.recomputeTotals(prompt),
          stats: this.stats(originalLength, originalLength, 'none', []),
        });
      }

      let working = this.clone(prompt);

      // Layer 1: always-safe collapse.
      const beforeL1 = this.length(working);
      working = this.applyWhitespace(working);
      if (this.length(working) !== beforeL1) segmentsAffected.push('whitespace');

      if (this.tokens(working) <= maxTokens || level === CompressionLevel.LIGHT) {
        return Result.success({
          prompt: this.recomputeTotals(working),
          stats: this.stats(originalLength, this.length(working), 'whitespace', segmentsAffected),
        });
      }

      // Layer 2: moderate truncation.
      const trimmed = this.truncateUserPromptToBudget(working, maxTokens, strategy);
      if (this.length(trimmed) !== this.length(working)) segmentsAffected.push('user-prompt-truncate');
      working = trimmed;

      if (this.tokens(working) <= maxTokens || level === CompressionLevel.MODERATE) {
        return Result.success({
          prompt: this.recomputeTotals(working),
          stats: this.stats(originalLength, this.length(working), 'truncate', segmentsAffected),
        });
      }

      // Layer 3: aggressive — drop developer prompt entirely, further shrink user prompt.
      if (working.developerPrompt) {
        working = { ...working, developerPrompt: undefined };
        segmentsAffected.push('developer-drop');
      }
      const aggressive = this.truncateUserPromptToBudget(working, maxTokens, strategy);
      if (this.length(aggressive) !== this.length(working)) segmentsAffected.push('user-prompt-truncate-hard');
      working = aggressive;

      return Result.success({
        prompt: this.recomputeTotals(working),
        stats: this.stats(originalLength, this.length(working), 'aggressive', segmentsAffected),
      });
    } catch (err) {
      return Result.failure(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private applyWhitespace(prompt: PromptPayload): PromptPayload {
    const collapse = (s: string) => s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return {
      ...prompt,
      systemPrompt: { ...prompt.systemPrompt, content: collapse(prompt.systemPrompt.content), compressed: true },
      developerPrompt: prompt.developerPrompt
        ? { ...prompt.developerPrompt, content: collapse(prompt.developerPrompt.content), compressed: true }
        : undefined,
      userPrompt: { ...prompt.userPrompt, content: collapse(prompt.userPrompt.content), compressed: true },
    };
  }

  private truncateUserPromptToBudget(
    prompt: PromptPayload,
    maxTokens: number,
    strategy: CompressionStrategy = CompressionStrategy.KEEP_TAIL
  ): PromptPayload {
    const sysTokens = this.budgeter.estimate(prompt.systemPrompt.content);
    const devTokens = prompt.developerPrompt
      ? this.budgeter.estimate(prompt.developerPrompt.content)
      : 0;
    const userBudget = Math.max(50, maxTokens - sysTokens - devTokens);
    const truncated = this.truncateToTokens(prompt.userPrompt.content, userBudget, strategy);
    return {
      ...prompt,
      userPrompt: { ...prompt.userPrompt, content: truncated, compressed: true },
    };
  }

  private truncateToTokens(
    text: string,
    tokens: number,
    strategy: CompressionStrategy = CompressionStrategy.KEEP_TAIL
  ): string {
    const targetChars = Math.max(0, tokens * 4);
    if (text.length <= targetChars) return text;

    switch (strategy) {
      case CompressionStrategy.KEEP_HEAD:
        // Keep initial context (good for JSON extraction, structured data)
        return `${text.slice(0, targetChars)}…`;

      case CompressionStrategy.KEEP_BOTH_ENDS:
        // Keep beginning and end, drop middle
        const halfChars = Math.floor(targetChars / 2);
        const head = text.slice(0, halfChars);
        const tail = text.slice(text.length - halfChars);
        return `${head}…[TRUNCATED]…${tail}`;

      case CompressionStrategy.KEEP_TAIL:
      default:
        // Keep most recent context (default for conversational)
        return `…${text.slice(text.length - targetChars)}`;
    }
  }

  private tokens(prompt: PromptPayload): number {
    return (
      this.budgeter.estimate(prompt.systemPrompt.content) +
      (prompt.developerPrompt ? this.budgeter.estimate(prompt.developerPrompt.content) : 0) +
      this.budgeter.estimate(prompt.userPrompt.content)
    );
  }

  private length(prompt: PromptPayload): number {
    return (
      prompt.systemPrompt.content.length +
      (prompt.developerPrompt?.content.length ?? 0) +
      prompt.userPrompt.content.length
    );
  }

  private recomputeTotals(prompt: PromptPayload): PromptPayload {
    const sysTokens = this.budgeter.estimate(prompt.systemPrompt.content);
    const devTokens = prompt.developerPrompt
      ? this.budgeter.estimate(prompt.developerPrompt.content)
      : 0;
    const userTokens = this.budgeter.estimate(prompt.userPrompt.content);

    return {
      ...prompt,
      systemPrompt: { ...prompt.systemPrompt, tokenCount: sysTokens },
      developerPrompt: prompt.developerPrompt
        ? { ...prompt.developerPrompt, tokenCount: devTokens }
        : undefined,
      userPrompt: { ...prompt.userPrompt, tokenCount: userTokens },
      totalTokens: sysTokens + devTokens + userTokens,
      segmentCount: prompt.developerPrompt ? 3 : 2,
    };
  }

  private clone(prompt: PromptPayload): PromptPayload {
    return {
      ...prompt,
      systemPrompt: { ...prompt.systemPrompt },
      developerPrompt: prompt.developerPrompt ? { ...prompt.developerPrompt } : undefined,
      userPrompt: { ...prompt.userPrompt },
    };
  }

  private stats(
    originalLength: number,
    compressedLength: number,
    technique: string,
    segmentsAffected: string[]
  ): CompressionStatistics {
    return {
      originalLength,
      compressedLength,
      ratio: originalLength === 0 ? 1 : compressedLength / originalLength,
      technique,
      segmentsAffected,
    };
  }

  private selectStrategy(promptType?: PromptType): CompressionStrategy {
    // Memory extraction and relationship updates benefit from head-keeping (structured data)
    if (promptType === PromptType.MEMORY_EXTRACTION || promptType === PromptType.RELATIONSHIP_UPDATE) {
      return CompressionStrategy.KEEP_HEAD;
    }
    // Default to keeping most recent context for conversational and other types
    return CompressionStrategy.KEEP_TAIL;
  }
}
