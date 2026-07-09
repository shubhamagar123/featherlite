import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { IModerationValidator, ModerationResult } from '../interfaces/moderation.interface';

interface OpenAIModerationResponse {
  results: Array<{
    flagged: boolean;
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
  }>;
}

export class OpenAIModerationValidator implements IModerationValidator {
  private readonly logger: Logger;
  private readonly apiKey: string;
  private readonly endpoint = 'https://api.openai.com/v1/moderations';

  constructor(apiKey: string) {
    this.logger = createLogger('OpenAIModerationValidator');
    this.apiKey = apiKey;
  }

  async moderate(text: string, _userId?: string): Promise<IResult<ModerationResult>> {
    try {
      if (!text || text.trim().length === 0) {
        return Result.success({
          flagged: false,
          categories: {
            sexual: false,
            hate: false,
            harassment: false,
            self_harm: false,
            sexual_minors: false,
            illegal: false,
            graphic: false,
            violence: false,
          },
          categoryScores: {},
        });
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ input: text }),
      });

      if (!response.ok) {
        this.logger.warn(
          { status: response.status, statusText: response.statusText },
          'OpenAI moderation API error'
        );
        // Fail open on API errors - allow content through
        return Result.success({
          flagged: false,
          categories: {
            sexual: false,
            hate: false,
            harassment: false,
            self_harm: false,
            sexual_minors: false,
            illegal: false,
            graphic: false,
            violence: false,
          },
          categoryScores: {},
        });
      }

      const data = (await response.json()) as OpenAIModerationResponse;
      const result = data.results[0];

      return Result.success({
        flagged: result.flagged,
        categories: {
          sexual: result.categories.sexual ?? false,
          hate: result.categories.hate ?? false,
          harassment: result.categories.harassment ?? false,
          self_harm: result.categories['self-harm'] ?? false,
          sexual_minors: result.categories['sexual/minors'] ?? false,
          illegal: result.categories.illegal ?? false,
          graphic: result.categories.violence ?? false,
          violence: result.categories.violence ?? false,
        },
        categoryScores: result.category_scores ?? {},
      });
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to call OpenAI moderation API');
      // Fail open - allow content through on error
      return Result.success({
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          self_harm: false,
          sexual_minors: false,
          illegal: false,
          graphic: false,
          violence: false,
        },
        categoryScores: {},
      });
    }
  }
}
