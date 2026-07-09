import { IResult } from '@services/types/result.type';
import { EventEnvelope, DeadLetterEntry, EventMetrics, DomainEventPayload } from '../dto/event.dto';
import { IEventHandler } from './event-handler.interface';
import { EventType, EventDispatchMode } from '../enums/event.enums';

export interface IEventBus {
  publish<T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope<T>,
    mode?: EventDispatchMode
  ): Promise<IResult<void>>;

  publishBatch<T extends DomainEventPayload = Record<string, any>>(
    envelopes: EventEnvelope<T>[],
    mode?: EventDispatchMode
  ): Promise<IResult<void>>;

  subscribe<T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: IEventHandler<T>,
    priority?: number
  ): string;

  unsubscribe(eventType: EventType, subscriptionId: string): IResult<void>;
  getDeadLetterQueue(): DeadLetterEntry[];
  getMetrics(): EventMetrics;
  reset(): void;
}

export interface IEventPublisher {
  publish<T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope<T>,
    mode?: EventDispatchMode
  ): Promise<IResult<void>>;

  publishBatch<T extends DomainEventPayload = Record<string, any>>(
    envelopes: EventEnvelope<T>[],
    mode?: EventDispatchMode
  ): Promise<IResult<void>>;
}

export interface IEventSubscriber {
  subscribe<T extends DomainEventPayload = Record<string, any>>(
    eventType: EventType,
    handler: IEventHandler<T>,
    priority?: number
  ): string;
  unsubscribe(eventType: EventType, subscriptionId: string): IResult<void>;
}

export interface IEventDispatcher {
  dispatch<T extends DomainEventPayload = Record<string, any>>(
    envelope: EventEnvelope<T>,
    mode: EventDispatchMode
  ): Promise<IResult<void>>;
}

export interface IEventRegistry {
  register(eventType: EventType, handler: IEventHandler, priority?: number): string;
  unregister(eventType: EventType, subscriptionId: string): boolean;
  getHandlers(eventType: EventType): Array<{ handler: IEventHandler; priority: number }>;
  getAllHandlers(): Map<EventType, Array<{ handler: IEventHandler; priority: number }>>;
}

export { IEventHandler };
