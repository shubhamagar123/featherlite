import { Result } from '../../../services/types/result.type';
import { ExpiryDecision, Memory } from '../dtos/memory.dto';
import { MemoryType, MemoryStatus } from '../enums/memory.enums';
import { IExpiryEvaluator } from '../interfaces/memory.interfaces';

export class ExpiryEvaluator implements IExpiryEvaluator {
  private readonly defaultRetentionDays: Record<MemoryType, number> = {
    [MemoryType.PERSON]: 365 * 5,
    [MemoryType.RELATIONSHIP]: 365 * 10,
    [MemoryType.PREFERENCE]: 365 * 2,
    [MemoryType.ROUTINE]: 180,
    [MemoryType.HEALTH]: 365 * 2,
    [MemoryType.WORK]: 365,
    [MemoryType.TRAVEL]: 365 * 3,
    [MemoryType.FOOD]: 180,
    [MemoryType.GOAL]: 365 * 2,
    [MemoryType.HABIT]: 180,
    [MemoryType.EVENT]: 365 * 5,
    [MemoryType.CONTEXT]: 90,
    [MemoryType.TEMPORARY]: 30,
    [MemoryType.LONG_TERM]: 365 * 10,
    [MemoryType.CONVERSATION_CALLBACK]: 7,
  };

  evaluate(memory: Memory): Result<ExpiryDecision> {
    return Result.try(() => {
      if (memory.status === MemoryStatus.ARCHIVED) {
        return {
          memoryId: memory.id,
          shouldExpire: false,
          expiryScore: 0,
          reason: 'Archived memories are not evaluated for expiry',
        };
      }

      if (memory.expiryAt) {
        const isExpired = new Date() > memory.expiryAt;
        if (isExpired) {
          return {
            memoryId: memory.id,
            shouldExpire: true,
            expiryScore: 100,
            reason: `Memory has passed its explicitly set expiry date: ${memory.expiryAt.toISOString()}`,
          };
        }
      }

      const ageInDays = Math.floor(
        (new Date().getTime() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const defaultRetention = this.defaultRetentionDays[memory.memoryType];

      let baseExpiryScore = Math.min(100, (ageInDays / defaultRetention) * 100);

      let importanceModifier = 1.0;
      if (memory.importance > 0.7) {
        importanceModifier = 0.3;
      } else if (memory.importance > 0.5) {
        importanceModifier = 0.6;
      } else if (memory.importance > 0.3) {
        importanceModifier = 0.9;
      }

      baseExpiryScore *= importanceModifier;

      let confidenceModifier = 1.0;
      if (memory.confidence < 0.3) {
        confidenceModifier = 1.2;
      } else if (memory.confidence < 0.5) {
        confidenceModifier = 1.1;
      }

      const expiryScore = Math.min(100, baseExpiryScore * confidenceModifier);

      const shouldExpire = expiryScore > 70;

      let reason = `Memory type "${memory.memoryType}" has default retention of ${defaultRetention} days. `;
      reason += `Current age: ${ageInDays} days. `;

      if (memory.importance > 0.7) {
        reason += `High importance (${memory.importance.toFixed(2)}) extends retention.`;
      } else if (memory.importance < 0.3) {
        reason += `Low importance (${memory.importance.toFixed(2)}) accelerates expiry.`;
      }

      let suggestedExpiryDate: Date | undefined;
      if (shouldExpire) {
        suggestedExpiryDate = new Date();
      } else {
        const daysUntilExpiry = Math.ceil(
          defaultRetention - ageInDays * importanceModifier
        );
        suggestedExpiryDate = new Date(
          new Date().getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000
        );
      }

      return {
        memoryId: memory.id,
        shouldExpire,
        expiryScore,
        reason,
        suggestedExpiryDate,
      };
    });
  }
}
