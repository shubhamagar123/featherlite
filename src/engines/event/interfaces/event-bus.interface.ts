import { IResult } from '@services/types/result.type';
import { EventEnvelope, DeadLetterEntry, EventMetrics } from '../dto/event.dto';
import { IEventHandler } from './event-handler.interface';
import { EventType, EventDispatchMode } from '../enums/event.enums';

export interface IEventBus {
  publish<T>(envelope: EventEnvelope<T>, mode?: EventDispatchMode): Promise<IResult<void>>;
  subscribe<T>(eventType: EventType, handler: IEventHandler<T>, priority?: number): string;
  unsubscribe(eventType: EventType, subscriptionId: string): IResult<void>;
  getDeadLetterQueue(): DeadLetterEntry[];
  getMetrics(): EventMetrics;
  reset(): void;
}

export interface IEventPublisher {
  publish<T>(envelope: EventEnvelope<T>, mode?: EventDispatchMode): Promise<IResult<void>>;
}

export interface IEventSubscriber {
  subscribe<T>(eventType: EventType, handler: IEventHandler<T>, priority?: number): string;
  unsubscribe(eventType: EventType, subscriptionId: string): IResult<void>;
}

export interface IEventDispatcher {
  dispatch<T>(envelope: EventEnvelope<T>, mode: EventDispatchMode): Promise<IResult<void>>;
}

export interface IEventRegistry {
  register(eventType: EventType, handler: IEventHandler, priority?: number): string;
  unregister(eventType: EventType, subscriptionId: string): boolean;
  getHandlers(eventType: EventType): Array<{ handler: IEventHandler; priority: number }>;
  getAllHandlers(): Map<EventType, Array<{ handler: IEventHandler; priority: number }>>;
}
