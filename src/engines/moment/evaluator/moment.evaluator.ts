import { IResult, Result } from '@services/types/result.type';
import { IMomentEvaluator } from '../interfaces/moment.interfaces';
import {
  MomentEvaluationInput,
  MomentEvaluationResult,
  MomentCandidate,
} from '../dtos/moment-engine.dtos';
import {
  MomentKind,
  MomentTrigger,
  MomentSignificance,
} from '../enums/moment.enums';
import { EventType } from '@engines/event';

/**
 * Turns raw domain events into moment candidates. Rules are intentionally
 * conservative — the engine emits a candidate only when there is enough signal
 * to justify a scheduled moment.
 */
export class MomentEvaluator implements IMomentEvaluator {
  evaluate(input: MomentEvaluationInput): IResult<MomentEvaluationResult> {
    const candidates: MomentCandidate[] = [];

    switch (input.eventType) {
      case EventType.MEMORY_CREATED:
        candidates.push(...this.fromMemoryCreated(input));
        break;
      case EventType.RELATIONSHIP_DIMENSION_CHANGED:
      case EventType.RELATIONSHIP_UPDATED:
        candidates.push(...this.fromRelationshipUpdated(input));
        break;
      case EventType.CONVERSATION_ENDED:
        candidates.push(...this.fromConversationEnded(input));
        break;
      case EventType.MESSAGE_SENT:
        candidates.push(...this.fromMessageSent(input));
        break;
    }

    return Result.success({ candidates });
  }

  private fromMemoryCreated(input: MomentEvaluationInput): MomentCandidate[] {
    const importance = (input.eventPayload.importance as number) ?? 0.5;
    if (importance < 0.7) return [];
    const title = (input.eventPayload.title as string) ?? 'Memorable moment';
    return [
      {
        userId: input.userId,
        companionId: input.companionId,
        kind: MomentKind.REFLECTION,
        trigger: MomentTrigger.MEMORY_CREATED,
        significance:
          importance >= 0.9 ? MomentSignificance.MILESTONE : MomentSignificance.HIGH,
        title: `Remembering: ${title}`,
        description: 'A memory worth revisiting together.',
        suggestedOccurAt: new Date(input.now.getTime() + 24 * 60 * 60 * 1000),
        data: { memoryId: input.eventPayload.aggregateId, importance },
      },
    ];
  }

  private fromRelationshipUpdated(input: MomentEvaluationInput): MomentCandidate[] {
    const delta = (input.eventPayload.delta as number) ?? 0;
    if (Math.abs(delta) < 0.15) return [];
    const positive = delta > 0;
    return [
      {
        userId: input.userId,
        companionId: input.companionId,
        kind: positive ? MomentKind.CELEBRATION : MomentKind.EMOTIONAL_SUPPORT,
        trigger: MomentTrigger.RELATIONSHIP_UPDATED,
        significance: MomentSignificance.MEDIUM,
        title: positive ? 'A milestone in our bond' : 'Reaching out with care',
        description: positive
          ? 'Recognize the progress we made together.'
          : 'Send warmth after a difficult stretch.',
        suggestedOccurAt: new Date(input.now.getTime() + 4 * 60 * 60 * 1000),
        data: { delta, dimension: input.eventPayload.dimension },
      },
    ];
  }

  private fromConversationEnded(input: MomentEvaluationInput): MomentCandidate[] {
    const messageCount = (input.eventPayload.messageCount as number) ?? 0;
    if (messageCount < 20) return [];
    return [
      {
        userId: input.userId,
        companionId: input.companionId,
        kind: MomentKind.CHECK_IN,
        trigger: MomentTrigger.CONVERSATION_ENDED,
        significance: MomentSignificance.LOW,
        title: 'A gentle check-in',
        description: 'Follow up after a substantial conversation.',
        suggestedOccurAt: new Date(input.now.getTime() + 48 * 60 * 60 * 1000),
        data: { messageCount },
      },
    ];
  }

  private fromMessageSent(input: MomentEvaluationInput): MomentCandidate[] {
    const flagged = input.eventPayload.momentFlag as string | undefined;
    if (!flagged) return [];
    return [
      {
        userId: input.userId,
        companionId: input.companionId,
        kind: MomentKind.CALLBACK,
        trigger: MomentTrigger.MESSAGE_SENT,
        significance: MomentSignificance.MEDIUM,
        title: `Callback: ${flagged}`,
        suggestedOccurAt: new Date(input.now.getTime() + 12 * 60 * 60 * 1000),
        data: { flag: flagged },
      },
    ];
  }
}
