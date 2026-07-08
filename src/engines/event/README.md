# Event Engine

A production-grade, loosely-coupled Domain Event system for Featherlite. The Event Engine enables cross-engine communication through asynchronous event publishing and subscription without direct dependencies between components.

## Design Principles

1. **Loose Coupling**: Publishers never know subscribers; handlers never know publishers
2. **In-Process First**: Designed for in-process pub/sub, replaceable with Kafka/RabbitMQ/EventBridge
3. **Ports & Adapters**: Clean interfaces enable alternative implementations
4. **Type Safety**: Full TypeScript support with event payload types
5. **Resilient**: Built-in retry logic, dead letter queue, and error handling
6. **Observable**: Comprehensive logging, metrics, and tracing support

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      EventEngine                             │
│  (Public API - IEventPublisher, IEventSubscriber)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    EventBus    EventRegistry    EventDispatcher
    (Broker)    (Handlers Map)    (Sync/Async)
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
    Handlers    Retry Logic         Dead Letter
    (Registry)  (Exponential)        Queue
```

## Core Components

### EventEngine
Main orchestrator implementing `IEventPublisher` and `IEventSubscriber`.

```typescript
const engine = new EventEngine();

// Subscribe
const subscriptionId = engine.subscribe(EventType.USER_CREATED, handler);

// Publish
await engine.publish(envelope, EventDispatchMode.SYNC);

// Unsubscribe
engine.unsubscribe(EventType.USER_CREATED, subscriptionId);
```

### EventBus
Central message broker managing subscriptions and dispatching events.

Features:
- Thread-safe handler registration
- Priority-based dispatch ordering
- Dead letter queue for failed events
- Metrics tracking
- Automatic retry with exponential backoff

### EventDispatcher
Handles synchronous and asynchronous event dispatch to handlers.

```typescript
await dispatcher.dispatch(envelope, EventDispatchMode.SYNC);   // Immediate
await dispatcher.dispatch(envelope, EventDispatchMode.ASYNC);  // Scheduled
```

### EventRegistry
Maintains a map of event types to registered handlers with priority ordering.

```typescript
const subscriptionId = registry.register(EventType.USER_CREATED, handler, priority);
registry.unregister(EventType.USER_CREATED, subscriptionId);
```

### BaseDomainEvent
Base class for all domain events with envelope and metadata.

```typescript
export class UserCreatedEvent extends BaseDomainEvent<UserCreatedPayload> {
  constructor(userId: string, payload: UserCreatedPayload, context: EventContext) {
    super(userId, AggregateType.USER, EventType.USER_CREATED, 'User Created', payload, context);
  }

  validate(): boolean {
    return Boolean(payload.username && payload.email);
  }
}
```

### BaseEventHandler
Base class for all event handlers with automatic envelope handling.

```typescript
export class UserCreatedEventHandler extends BaseEventHandler<UserCreatedPayload> {
  constructor() {
    super(EventType.USER_CREATED, 5, false); // type, priority, isAsync
  }

  protected async onEvent(envelope: EventEnvelope<UserCreatedPayload>): Promise<void> {
    // Handle the event
  }
}
```

## Event Model

Every event contains:

```typescript
interface EventEnvelope<T> {
  metadata: EventMetadata;
  aggregateId: string;
  aggregateType: AggregateType;
  payload: T;
  status: EventStatus;
  attemptCount: number;
  lastError?: Error;
  publishedAt?: Date;
  handledAt?: Date;
}

interface EventMetadata {
  eventId: string;                    // UUID
  eventName: string;
  eventType: EventType;
  version: number;
  occurredAt: Date;
  correlationId: string;              // Trace across events
  causationId?: string;               // Link causally related events
  traceId?: string;                   // Distributed tracing
  userId?: string;
  companionId?: string;
  priority: EventPriority;            // LOW (0) to CRITICAL (3)
  source: string;
  environment: string;
}
```

## Usage Examples

### Publishing Events

```typescript
const context = EventContextBuilder.create()
  .withUserId('user-123')
  .withCorrelationId('trace-456')
  .build();

const envelope = EventFactory.createEnvelope(
  'user-123',
  AggregateType.USER,
  EventType.USER_CREATED,
  'User Created',
  { username: 'john', email: 'john@example.com' },
  context,
  EventPriority.NORMAL
);

await engine.publish(envelope, EventDispatchMode.SYNC);
```

### Subscribing to Events

```typescript
class UserCreatedHandler extends BaseEventHandler<UserCreatedPayload> {
  constructor() {
    super(EventType.USER_CREATED, 5, false);
  }

  protected async onEvent(envelope: EventEnvelope<UserCreatedPayload>): Promise<void> {
    const { username, email } = envelope.payload;
    // Handle user creation...
  }
}

const handler = new UserCreatedHandler();
const subscriptionId = engine.subscribe(EventType.USER_CREATED, handler);

// Later, if needed:
engine.unsubscribe(EventType.USER_CREATED, subscriptionId);
```

### Event Chaining

```typescript
const correlationId = randomUUID();

// Event 1
const userCreated = EventFactory.createEnvelope(...);
await engine.publish(userCreated);

// Event 2 (causally linked)
const relationshipCreated = EventFactory.withCausation(
  EventFactory.createEnvelope(...),
  userCreated.metadata.eventId
);
await engine.publish(relationshipCreated);
```

## Priority & Ordering

Handlers are executed in priority order (highest to lowest).

```typescript
engine.subscribe(EventType.USER_CREATED, logHandler, 1);        // Runs last
engine.subscribe(EventType.USER_CREATED, notifyHandler, 5);     // Runs first
engine.subscribe(EventType.USER_CREATED, recordHandler, 10);    // Runs second
```

## Retry & Resilience

Built-in retry logic with exponential backoff:

```typescript
const retryPolicy: EventRetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  backoffJitter: true,
};

const engine = new EventEngine(retryPolicy);
```

Failed events move to the dead letter queue after exhausting retries:

```typescript
const dlq = engine.getDeadLetterQueue();
dlq.forEach(entry => {
  console.log(`Failed: ${entry.envelope.metadata.eventId}`);
  console.log(`Reason: ${entry.reason}`);
  console.log(`Attempted handlers:`, entry.handlers);
});
```

## Metrics

Track event flow:

```typescript
const metrics = engine.getMetrics();
console.log(`Published: ${metrics.published}`);
console.log(`Processed: ${metrics.processed}`);
console.log(`Failed: ${metrics.failed}`);
console.log(`Dead Lettered: ${metrics.deadLettered}`);
console.log(`Avg Processing Time: ${metrics.averageProcessingTimeMs}ms`);
```

## Supported Events

### User Events
- `UserCreatedEvent`
- `UserUpdatedEvent`

### Relationship Events
- `RelationshipUpdatedEvent`
- `RelationshipDimensionChangedEvent`

### Conversation Events
- `ConversationStartedEvent`
- `ConversationEndedEvent`

### Message Events
- `MessageSentEvent`
- `MessageReceivedEvent`

### Memory Events
- `MemoryCreatedEvent`
- `MemoryExpiredEvent`

### Moment Events
- `MomentTriggeredEvent`

### Notification Events
- `NotificationScheduledEvent`
- `NotificationSentEvent`

### World Events
- `WorldGeneratedEvent`
- `WorldUpdatedEvent`

### Companion Events
- `CompanionChangedEvent`
- `CompanionStateChangedEvent`

### Interaction Events
- `InteractionStartedEvent`
- `InteractionEndedEvent`

### Prompt Events
- `PromptBuiltEvent`

### LLM Events
- `LLMResponseGeneratedEvent`

## Dispatch Modes

### Synchronous
Events are processed immediately before `publish()` returns. Ideal for critical operations requiring immediate feedback.

```typescript
await engine.publish(envelope, EventDispatchMode.SYNC);
```

### Asynchronous
Events are scheduled for processing on the next event loop iteration. Ideal for non-blocking, fire-and-forget operations.

```typescript
await engine.publish(envelope, EventDispatchMode.ASYNC);
```

## Testing

```typescript
it('should handle UserCreatedEvent', async () => {
  let handled = false;

  class TestHandler extends BaseEventHandler {
    protected async onEvent(): Promise<void> {
      handled = true;
    }
  }

  engine.subscribe(EventType.USER_CREATED, new TestHandler());

  const envelope = EventFactory.createEnvelope(
    'user-1',
    AggregateType.USER,
    EventType.USER_CREATED,
    'User Created',
    { username: 'john', email: 'john@example.com' },
    EventContextBuilder.create().build()
  );

  await engine.publish(envelope);

  expect(handled).toBe(true);
});
```

## Future Enhancements

The Event Engine is designed to be replaceable:

1. **Kafka**: Distribute events across microservices
2. **RabbitMQ**: AMQP-based event broker
3. **AWS EventBridge**: Serverless event routing
4. **Google Pub/Sub**: Cloud-native messaging
5. **Azure Event Hubs**: Scalable telemetry ingestion

These implementations can follow the same `IEventBus`, `IEventPublisher`, `IEventSubscriber` interfaces without changing business code.

## Dependencies

- `@services/types/result.type`: Result monadic type
- `@utils/logger`: Structured logging (pino)
- `Node.js crypto`: UUID generation

## Performance Characteristics

- **Subscription**: O(1) registration per handler, O(n log n) sorting by priority
- **Publishing**: O(n) where n = handlers for event type
- **Dispatch**: Linear per handler with configurable retry backoff
- **Memory**: O(m) where m = total registered handlers

## Thread Safety

The Event Engine is thread-safe for:
- Subscribe/unsubscribe operations
- Concurrent event publishing
- Metrics updates

Events are processed sequentially per event type to maintain ordering.

## Logging

All operations are logged with structured data:

```
EventEngine: Event published
  eventId: "550e8400-e29b-41d4-a716-446655440000"
  eventType: "USER_CREATED"
  status: "PUBLISHED"
  durationMs: 42
```

## License

Part of Featherlite - Production-grade companion AI platform
