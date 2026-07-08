import { IResult } from '@services/types/result.type';
import { IEventBus, IEventPublisher, IEventSubscriber } from './interfaces/event-bus.interface';
import { IEventHandler } from './interfaces/event-handler.interface';
import { EventBus } from './core/event-bus';
import {
  EventEnvelope,
  DomainEventPayload,
  EventMetrics,
  EventRetryPolicy,
  DeadLetterEntry,
} from './dto/event.dto';
import { EventType, EventDispatchMode } from './enums/event.enums';

export class EventEngine implements IEventPublisher, IEventSubscriber {
  private readonly bus: IEventBus;

  constructor(retryPolicy?: EventRetryPolicy) {
    this.bus = new EventBus(retryPolicy);
  }

  async publish<T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope<T>,
    mode: EventDispatchMode = EventDispatchMode.SYNC
  ): Promise<IResult<void>> {
    return this.bus.publish(envelope, mode);
  }

  subscribe<T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: IEventHandler<T>,
    priority?: number
  ): string {
    return this.bus.subscribe(eventType, handler, priority);
  }

  unsubscribe(eventType: EventType, subscriptionId: string): IResult<void> {
    return this.bus.unsubscribe(eventType, subscriptionId);
  }

  getDeadLetterQueue(): DeadLetterEntry[] {
    return this.bus.getDeadLetterQueue();
  }

  getMetrics(): EventMetrics {
    return this.bus.getMetrics();
  }

  reset(): void {
    this.bus.reset();
  }
}

export { IEventBus, IEventPublisher, IEventSubscriber, IEventHandler } from './interfaces/event-bus.interface';
export { BaseDomainEvent } from './contracts/base-domain-event';
export { BaseEventHandler } from './contracts/base-event-handler';
export { EventFactory } from './core/event-factory';
export { EventContextBuilder, EventContextManager } from './core/event-context';
export { EventSerializer } from './core/event-serializer';
export { EventBus } from './core/event-bus';
export { EventRegistry } from './core/event-registry';
export { EventDispatcher } from './core/event-dispatcher';
export * from './dto/event.dto';
export * from './enums/event.enums';
export * from './events/index';
