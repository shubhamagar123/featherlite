import { IResult } from '@services/types/result.type';

export interface ModerationResult {
  flagged: boolean;
  categories: {
    sexual: boolean;
    hate: boolean;
    harassment: boolean;
    self_harm: boolean;
    sexual_minors: boolean;
    illegal: boolean;
    graphic: boolean;
    violence: boolean;
    [key: string]: boolean;
  };
  categoryScores: Record<string, number>;
}

export interface IModerationValidator {
  moderate(text: string, userId?: string): Promise<IResult<ModerationResult>>;
}
