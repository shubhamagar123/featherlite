import { Result } from '../../../services/types/result.type';
import { ClassificationResult, Entity } from '../dto/memory.dto';
import { MemoryType } from '../enums/memory.enums';
import { IMemoryClassifier } from '../interfaces/memory.interfaces';

export class MemoryClassifier implements IMemoryClassifier {
  classify(text: string, entities: Entity[]): Result<ClassificationResult> {
    return Result.try(() => {
      const scores: Record<MemoryType, number> = {
        [MemoryType.PERSON]: 0,
        [MemoryType.RELATIONSHIP]: 0,
        [MemoryType.PREFERENCE]: 0,
        [MemoryType.ROUTINE]: 0,
        [MemoryType.HEALTH]: 0,
        [MemoryType.WORK]: 0,
        [MemoryType.TRAVEL]: 0,
        [MemoryType.FOOD]: 0,
        [MemoryType.GOAL]: 0,
        [MemoryType.HABIT]: 0,
        [MemoryType.EVENT]: 0,
        [MemoryType.CONTEXT]: 0,
        [MemoryType.TEMPORARY]: 0,
        [MemoryType.LONG_TERM]: 0,
        [MemoryType.CONVERSATION_CALLBACK]: 0,
      };

      const lowerText = text.toLowerCase();

      // PERSON: mentions of individuals, personal information
      if (
        /\b(name|person|individual|he|she|they|called|named|friend|colleague)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.PERSON] += 0.3;
      }

      // RELATIONSHIP: interactions, feelings about others
      if (
        /\b(relationship|friend|loves|likes|trusts|respects|connected|bond)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.RELATIONSHIP] += 0.4;
      }

      // PREFERENCE: likes, dislikes, preferences
      if (
        /\b(prefer|like|love|hate|dislike|enjoy|favorite|prefer|taste|color)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.PREFERENCE] += 0.4;
      }

      // ROUTINE: recurring activities, habits
      if (
        /\b(every|daily|morning|evening|usually|routine|always|typical|habit)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.ROUTINE] += 0.4;
      }

      // HEALTH: health, fitness, medical, wellness
      if (
        /\b(health|sick|disease|exercise|fit|medical|doctor|hospital|health|workout|pain)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.HEALTH] += 0.4;
      }

      // WORK: job, career, work-related
      if (
        /\b(work|job|career|company|project|professional|boss|colleague|meeting|deadline)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.WORK] += 0.4;
      }

      // TRAVEL: travel, places, trips
      if (
        /\b(travel|visit|trip|vacation|explore|journey|destination|flew|drive)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.TRAVEL] += 0.4;
      }

      // FOOD: food, cooking, cuisine
      if (
        /\b(food|eat|restaurant|cook|cuisine|recipe|taste|pizza|coffee|lunch|dinner|breakfast)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.FOOD] += 0.4;
      }

      // GOAL: goals, aspirations, dreams
      if (
        /\b(goal|dream|aspiration|want|achieve|accomplish|target|hope|future)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.GOAL] += 0.4;
      }

      // HABIT: repeated behaviors
      if (
        /\b(habit|practice|routine|frequently|often|usual|typically|tend to)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.HABIT] += 0.3;
      }

      // EVENT: specific events, moments
      if (
        /\b(happened|occurred|event|day|night|moment|time|when|during|after)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.EVENT] += 0.2;
      }

      // CONTEXT: background, setting, conditions
      if (
        /\b(context|background|situation|condition|environment|setting|around|about)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.CONTEXT] += 0.2;
      }

      // TEMPORARY: short-term, temporary info
      if (
        /\b(temporary|temporary|short[- ]term|for now|currently|at the moment|soon)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.TEMPORARY] += 0.3;
      }

      // LONG_TERM: long-term, permanent, lasting
      if (
        /\b(long[- ]term|permanent|lasting|always|forever|year|life|forever)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.LONG_TERM] += 0.3;
      }

      // CONVERSATION_CALLBACK: follow-ups, reminders
      if (
        /\b(remember|follow[- ]?up|callback|ask|tell|mention|remind)\b/.test(
          lowerText
        )
      ) {
        scores[MemoryType.CONVERSATION_CALLBACK] += 0.4;
      }

      const maxScore = Math.max(...Object.values(scores));
      const primaryType = (
        Object.entries(scores).find(([, score]) => score === maxScore)?.[0] ||
        MemoryType.CONTEXT
      ) as MemoryType;
      const primaryConfidence = Math.min(1.0, maxScore + 0.1 * entities.length);

      const alternativeTypes = Object.entries(scores)
        .filter(([type]) => type !== primaryType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type, score]) => ({
          type: type as MemoryType,
          confidence: Math.min(1.0, score + 0.05 * entities.length),
        }));

      return {
        memoryType: primaryType,
        confidence: primaryConfidence,
        alternativeTypes,
      };
    });
  }
}
