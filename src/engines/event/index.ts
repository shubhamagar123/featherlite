export { EventEngine } from './event.engine';
export { getEventEngine, resetEventEngine, type EventEngineDeps } from './event.factory';

export {
  IEventBus,
  IEventPublisher,
  IEventSubscriber,
  IEventHandler,
  IEventDispatcher,
  IEventRegistry,
} from './interfaces/event-bus.interface';

export { BaseDomainEvent } from './contracts/base-domain-event';
export { BaseEventHandler } from './contracts/base-event-handler';

export { EventFactory } from './core/event-factory';
export { EventContextBuilder, EventContextManager } from './core/event-context';
export { EventSerializer } from './core/event-serializer';
export { EventBus } from './core/event-bus';
export { EventRegistry } from './core/event-registry';
export { EventDispatcher } from './core/event-dispatcher';

export type {
  EventMetadata,
  EventContext,
  EventEnvelope,
  DomainEventPayload,
  EventHandlerMetadata,
  DeadLetterEntry,
  EventRetryPolicy,
  EventMetrics,
} from './dto/event.dto';

export {
  EventType,
  EventPriority,
  EventDispatchMode,
  EventStatus,
  AggregateType,
} from './enums/event.enums';

export {
  UserCreatedEvent,
  RelationshipUpdatedEvent,
  RelationshipDimensionChangedEvent,
  ConversationStartedEvent,
  MessageSentEvent,
  MemoryCreatedEvent,
} from './events/index';

export type {
  UserCreatedPayload,
  RelationshipUpdatedPayload,
  RelationshipDimensionChangedPayload,
  ConversationStartedPayload,
  MessageSentPayload,
  MemoryCreatedPayload,
} from './events/index';
