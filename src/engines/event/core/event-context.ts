import { EventContext } from '../dto/event.dto';
import { randomUUID } from 'crypto';

export class EventContextBuilder {
  private userId?: string;
  private companionId?: string;
  private requestId?: string;
  private correlationId: string = randomUUID();
  private causationId?: string;
  private traceId: string = randomUUID();

  static create(): EventContextBuilder {
    return new EventContextBuilder();
  }

  withUserId(userId: string): EventContextBuilder {
    this.userId = userId;
    return this;
  }

  withCompanionId(companionId: string): EventContextBuilder {
    this.companionId = companionId;
    return this;
  }

  withRequestId(requestId: string): EventContextBuilder {
    this.requestId = requestId;
    return this;
  }

  withCorrelationId(correlationId: string): EventContextBuilder {
    this.correlationId = correlationId;
    return this;
  }

  withCausationId(causationId: string): EventContextBuilder {
    this.causationId = causationId;
    return this;
  }

  withTraceId(traceId: string): EventContextBuilder {
    this.traceId = traceId;
    return this;
  }

  withContext(context: Partial<EventContext>): EventContextBuilder {
    if (context.userId) this.userId = context.userId;
    if (context.companionId) this.companionId = context.companionId;
    if (context.requestId) this.requestId = context.requestId;
    if (context.correlationId) this.correlationId = context.correlationId;
    if (context.causationId) this.causationId = context.causationId;
    if (context.traceId) this.traceId = context.traceId;
    return this;
  }

  build(): EventContext {
    return {
      userId: this.userId,
      companionId: this.companionId,
      requestId: this.requestId,
      correlationId: this.correlationId,
      causationId: this.causationId,
      traceId: this.traceId,
    };
  }
}

export class EventContextManager {
  private static current: EventContext | null = null;

  static setCurrent(context: EventContext): void {
    EventContextManager.current = context;
  }

  static getCurrent(): EventContext {
    return (
      EventContextManager.current || {
        correlationId: randomUUID(),
        traceId: randomUUID(),
      }
    );
  }

  static clear(): void {
    EventContextManager.current = null;
  }
}
