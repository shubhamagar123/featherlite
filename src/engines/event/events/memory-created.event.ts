import { BaseDomainEvent } from '../contracts/base-domain-event';
import { EventType, AggregateType, EventPriority } from '../enums/event.enums';
import { EventContext } from '../dto/event.dto';

export interface MemoryCreatedPayload {
  userId: string;
  companionId: string;
  title: string;
  content: string;
  tags?: string[];
  importance?: number;
}

export class MemoryCreatedEvent extends BaseDomainEvent<MemoryCreatedPayload> {
  constructor(
    memoryId: string,
    payload: MemoryCreatedPayload,
    context: EventContext
  ) {
    super(
      memoryId,
      AggregateType.MEMORY,
      EventType.MEMORY_CREATED,
      'Memory Created',
      payload,
      context,
      EventPriority.NORMAL,
      1
    );
  }

  validate(): boolean {
    const payload = this.getPayload();
    return Boolean(payload.userId && payload.companionId && payload.title && payload.content);
  }

  getTitle(): string {
    return this.getPayload().title;
  }

  getContent(): string {
    return this.getPayload().content;
  }

  getTags(): string[] | undefined {
    return this.getPayload().tags;
  }

  getImportance(): number | undefined {
    return this.getPayload().importance;
  }
}
