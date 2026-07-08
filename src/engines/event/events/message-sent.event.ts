import { BaseDomainEvent } from '../contracts/base-domain-event';
import { EventType, AggregateType, EventPriority } from '../enums/event.enums';
import { EventContext } from '../dto/event.dto';

export interface MessageSentPayload {
  conversationId: string;
  senderId: string;
  content: string;
  contentType: string;
  metadata?: Record<string, any>;
}

export class MessageSentEvent extends BaseDomainEvent<MessageSentPayload> {
  constructor(
    messageId: string,
    payload: MessageSentPayload,
    context: EventContext
  ) {
    super(
      messageId,
      AggregateType.MESSAGE,
      EventType.MESSAGE_SENT,
      'Message Sent',
      payload,
      context,
      EventPriority.NORMAL,
      1
    );
  }

  validate(): boolean {
    const payload = this.getPayload();
    return Boolean(
      payload.conversationId &&
      payload.senderId &&
      payload.content &&
      payload.contentType
    );
  }

  getConversationId(): string {
    return this.getPayload().conversationId;
  }

  getSenderId(): string {
    return this.getPayload().senderId;
  }

  getContent(): string {
    return this.getPayload().content;
  }

  getContentType(): string {
    return this.getPayload().contentType;
  }
}
