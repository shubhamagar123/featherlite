import { BaseDomainEvent } from '../contracts/base-domain-event';
import { EventType, AggregateType, EventPriority } from '../enums/event.enums';
import { EventContext } from '../dto/event.dto';

export interface ConversationStartedPayload {
  userId: string;
  companionId: string;
  context?: string;
  initialMessage?: string;
}

export class ConversationStartedEvent extends BaseDomainEvent<ConversationStartedPayload> {
  constructor(
    conversationId: string,
    payload: ConversationStartedPayload,
    context: EventContext
  ) {
    super(
      conversationId,
      AggregateType.CONVERSATION,
      EventType.CONVERSATION_STARTED,
      'Conversation Started',
      payload,
      context,
      EventPriority.NORMAL,
      1
    );
  }

  validate(): boolean {
    const payload = this.getPayload();
    return Boolean(payload.userId && payload.companionId);
  }

  getContext(): string | undefined {
    return this.getPayload().context;
  }

  getInitialMessage(): string | undefined {
    return this.getPayload().initialMessage;
  }
}
