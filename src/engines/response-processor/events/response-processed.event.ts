import { BaseDomainEvent } from '@engines/event';
import { EventType, AggregateType, EventPriority } from '@engines/event';
import type { EventContext } from '@engines/event';

export interface ResponseProcessedPayload {
  requestId: string;
  userId: string;
  companionId: string;
  isValid: boolean;
  isSafe: boolean;
  detectionsCount: number;
  finalContentLength: number;
  durationMs: number;
}

/**
 * Response Processor uses the existing LLM_RESPONSE_GENERATED event type on the
 * shared enum for downstream consumers because a dedicated event type is not
 * required by other engines; this class is exposed for symmetry when a domain
 * event is needed.
 */
export class ResponseProcessedEvent extends BaseDomainEvent<ResponseProcessedPayload> {
  constructor(aggregateId: string, payload: ResponseProcessedPayload, context: EventContext) {
    super(
      aggregateId,
      AggregateType.PROMPT,
      EventType.LLM_RESPONSE_GENERATED,
      'LLM Response Processed',
      payload,
      context,
      EventPriority.LOW,
      1
    );
  }

  validate(): boolean {
    const p = this.getPayload();
    return Boolean(p.requestId && p.userId && p.companionId);
  }
}
