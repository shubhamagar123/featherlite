# Event-Driven Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Featherlite Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Event Engine (Core Hub)               │   │
│  │                                                           │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ EventBus    │  │ EventRegistry│  │ EventDispat- │   │   │
│  │  │ (Broker)    │  │ (Handlers)   │  │ cher (Sync/  │   │   │
│  │  │             │  │              │  │ Async)       │   │   │
│  │  └─────────────┘  └──────────────┘  └──────────────┘   │   │
│  │                                                           │   │
│  │  Dead Letter Queue │ Metrics │ Retry & Resilience        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ▲                                      │
│              ┌────────────┼────────────┐                         │
│              │            │            │                         │
│         Publishers    Publishers   Publishers                    │
│              │            │            │                         │
│    ┌─────────▼──┐  ┌──────▼────┐  ┌──▼───────────┐            │
│    │Relationship│  │Conversation│  │Memory Engine │            │
│    │Engine      │  │Engine       │  │(Future)      │            │
│    │            │  │             │  │              │            │
│    │ Publishes: │  │ Publishes:  │  │ Publishes:   │            │
│    │ • Rel      │  │ • Conv      │  │ • Memory     │            │
│    │   Created  │  │   Started   │  │   Created    │            │
│    │ • Rel      │  │ • Msg Sent  │  │ • Memory     │            │
│    │   Updated  │  │ • Conv      │  │   Expired    │            │
│    │ • Dim      │  │   Ended     │  │              │            │
│    │   Changed  │  │             │  │              │            │
│    └─────────────┘  └─────────────┘  └──────────────┘            │
│         ▲                  ▲                 ▲                   │
│         │ Subscribes       │ Subscribes     │ Subscribes         │
│         └────────────┬─────┴────────────────┴──────────┐        │
│                      │ Handlers (Subscribers)           │        │
│    ┌─────────────────▼────────────────────────────────┐│        │
│    │                 Handler Registry                  ││        │
│    │                                                   ││        │
│    │ • RelationshipEventHandlers                      ││        │
│    │ • ConversationEventHandlers                      ││        │
│    │ • NotificationEventHandlers                      ││        │
│    │ • AnalyticsEventHandlers                         ││        │
│    └───────────────────────────────────────────────────┘│        │
│                                                         │        │
└─────────────────────────────────────────────────────────┘        │
```

## Event Flow Diagram

```
User Action
    │
    ▼
┌──────────────────────┐
│ Relationship Engine  │  Records event
│  recordEvent()       │  Updates dimensions
└──────────┬───────────┘  Calculates changes
           │
           │ Publishes: RELATIONSHIP_DIMENSION_CHANGED
           ▼
    ┌─────────────┐
    │ Event Bus   │  Finds handlers
    └─────┬───────┘  (Priority ordered)
          │
    ┌─────┴──────────────┬──────────────┬──────────────┐
    │                    │              │              │
    ▼                    ▼              ▼              ▼
┌─────────┐       ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Handler │       │  Handler   │ │  Handler   │ │  Handler   │
│Priority │       │ Priority 5 │ │ Priority 3 │ │ Priority 1 │
│  10     │       │ (Logging)  │ │(Metrics)   │ │(Analytics) │
│(Alert)  │       │            │ │            │ │            │
└─────────┘       └────────────┘ └────────────┘ └────────────┘
    │                   │              │              │
    │ All handlers execute in order (highest priority first)
    │ Errors caught, DLQ capture, retry on failure
    │
    └────────────────────────────────┬─────────────────────┐
                                     │                     │
                            ┌────────▼──────┐       ┌─────▼──────┐
                            │ Persist Data  │       │ Notify     │
                            │ Update Caches │       │ Subscribers│
                            └───────────────┘       └────────────┘
```

## Event-Driven Communication Pattern

### Before (Tightly Coupled)
```
Relationship Engine
    │
    ├─→ Directly calls Memory Engine
    ├─→ Directly calls Notification Engine
    └─→ Directly calls Analytics Engine

Problems:
- Circular dependencies
- Hard to test in isolation
- Tight coupling
- Can't replace engines easily
```

### After (Event-Driven)
```
Relationship Engine
    │
    └─→ Publishes: RELATIONSHIP_DIMENSION_CHANGED
            │
            ├─→ Memory Engine (Handler) - React & store
            ├─→ Notification Engine (Handler) - Notify user
            └─→ Analytics Engine (Handler) - Track metrics

Benefits:
- No direct dependencies
- Easy to test (mock EventEngine)
- Loose coupling
- Engines are replaceable
- Multiple handlers per event
```

---

## Event Catalog

### USER AGGREGATE

#### UserCreatedEvent
**Published By**: User Engine (Future)
**Aggregate Type**: USER
**Priority**: NORMAL

**Payload**:
```typescript
{
  username: string;
  email: string;
  displayName?: string;
  timezone?: string;
}
```

**Subscribers**:
- NotificationEngine: Send welcome email
- AnalyticsEngine: Track signup
- RelationshipEngine: Initialize relationship data

---

### RELATIONSHIP AGGREGATE

#### RelationshipCreatedEvent
**Published By**: RelationshipEngine.createRelationship()
**Event Type**: RELATIONSHIP_UPDATED
**Aggregate Type**: RELATIONSHIP
**Priority**: HIGH

**Payload**:
```typescript
{
  userId: string;
  companionId: string;
  status: string;              // "INITIATED"
  phase: string;               // "INITIAL_ATTRACTION"
}
```

**Subscribers**:
- AnalyticsEngine: Track new relationship
- NotificationEngine: Send greeting to companion
- HistoryEngine: Record relationship creation

---

#### RelationshipUpdatedEvent
**Published By**: RelationshipEngine.recordEvent()
**Event Type**: RELATIONSHIP_UPDATED
**Aggregate Type**: RELATIONSHIP
**Priority**: NORMAL

**Payload**:
```typescript
{
  userId: string;
  companionId: string;
  status: string;              // INITIATED | DEEPENING | ESTABLISHED | etc
  phase: string;               // EXPLORATION | DEEPENING | RESILIENCE | etc
  overallHealth: number;       // 0-100
  trajectory: number;          // Trend direction
}
```

**Subscribers**:
- AnalyticsEngine: Track relationship metrics
- NotificationEngine: Alert on status changes
- HistoryEngine: Record state changes

---

#### RelationshipDimensionChangedEvent
**Published By**: RelationshipEngine.recordEvent()
**Event Type**: RELATIONSHIP_DIMENSION_CHANGED
**Aggregate Type**: RELATIONSHIP
**Priority**: NORMAL

**Payload**:
```typescript
{
  userId: string;
  companionId: string;
  dimension: string;           // TRUST | COMFORT | PLAYFULNESS | etc
  oldValue: number;            // Previous dimension value (0-100)
  newValue: number;            // Updated dimension value (0-100)
  change: number;              // newValue - oldValue
  reason: string;              // What caused the change
}
```

**Subscribers**:
- AnalyticsEngine: Track dimension trends
- NotificationEngine: Alert on significant changes
- HistoryEngine: Record dimension evolution
- MemoryEngine: Connect memories to dimension changes

---

### CONVERSATION AGGREGATE

#### ConversationStartedEvent
**Published By**: ConversationEngine (Future)
**Event Type**: CONVERSATION_STARTED
**Aggregate Type**: CONVERSATION
**Priority**: NORMAL

**Payload**:
```typescript
{
  userId: string;
  companionId: string;
  context?: string;
  initialMessage?: string;
}
```

**Subscribers**:
- RelationshipEngine: Update interaction metrics
- AnalyticsEngine: Track engagement
- HistoryEngine: Record conversation start

---

#### ConversationEndedEvent (Seed defined, not published yet)
**Published By**: ConversationEngine (Future)
**Event Type**: CONVERSATION_ENDED
**Aggregate Type**: CONVERSATION
**Priority**: NORMAL

**Subscribers**:
- RelationshipEngine: Calculate interaction quality
- AnalyticsEngine: Track session duration
- NotificationEngine: Send summary

---

### MESSAGE AGGREGATE

#### MessageSentEvent
**Published By**: MessageEngine (Future)
**Event Type**: MESSAGE_SENT
**Aggregate Type**: MESSAGE
**Priority**: NORMAL

**Payload**:
```typescript
{
  conversationId: string;
  senderId: string;           // user or companion
  content: string;
  contentType: string;         // text | image | etc
  metadata?: Record<string, any>;
}
```

**Subscribers**:
- RelationshipEngine: Process interaction
- ConversationEngine: Update thread
- AnalyticsEngine: Track message patterns
- HistoryEngine: Store message record

---

#### MessageReceivedEvent (Seed defined, not published yet)
**Published By**: MessageEngine (Future)
**Event Type**: MESSAGE_RECEIVED
**Aggregate Type**: MESSAGE
**Priority**: NORMAL

**Subscribers**:
- NotificationEngine: Alert recipient
- AnalyticsEngine: Track response times

---

### MEMORY AGGREGATE

#### MemoryCreatedEvent
**Published By**: MemoryEngine (Future)
**Event Type**: MEMORY_CREATED
**Aggregate Type**: MEMORY
**Priority**: NORMAL

**Payload**:
```typescript
{
  userId: string;
  companionId: string;
  title: string;
  content: string;
  tags?: string[];
  importance?: number;         // 0-10 priority
}
```

**Subscribers**:
- RelationshipEngine: Grow SHARED_MEMORIES dimension
- AnalyticsEngine: Track memory creation
- NotificationEngine: Optional memory milestone alerts

---

#### MemoryExpiredEvent
**Published By**: MemoryEngine (Future)
**Event Type**: MEMORY_EXPIRED
**Aggregate Type**: MEMORY
**Priority**: NORMAL

**Subscribers**:
- RelationshipEngine: Decay SHARED_MEMORIES dimension
- HistoryEngine: Archive expired memory

---

### MOMENT AGGREGATE

#### MomentTriggeredEvent
**Published By**: MomentEngine (Future)
**Event Type**: MOMENT_TRIGGERED
**Aggregate Type**: MOMENT
**Priority**: HIGH

**Subscribers**:
- RelationshipEngine: Record significant moment
- NotificationEngine: Alert user about moment
- AnalyticsEngine: Track moment engagement

---

### NOTIFICATION AGGREGATE

#### NotificationScheduledEvent
**Published By**: NotificationEngine
**Event Type**: NOTIFICATION_SCHEDULED
**Aggregate Type**: NOTIFICATION
**Priority**: NORMAL

**Subscribers**:
- AnalyticsEngine: Track scheduled notifications

---

#### NotificationSentEvent
**Published By**: NotificationEngine
**Event Type**: NOTIFICATION_SENT
**Aggregate Type**: NOTIFICATION
**Priority**: NORMAL

**Subscribers**:
- AnalyticsEngine: Track delivery
- HistoryEngine: Record notification

---

### WORLD AGGREGATE

#### WorldGeneratedEvent (Seed defined, not published yet)
**Published By**: WorldEngine (Future)
**Event Type**: WORLD_GENERATED
**Aggregate Type**: WORLD
**Priority**: NORMAL

**Subscribers**:
- AnalyticsEngine: Track world generation

---

#### WorldUpdatedEvent (Seed defined, not published yet)
**Published By**: WorldEngine (Future)
**Event Type**: WORLD_UPDATED
**Aggregate Type**: WORLD
**Priority**: NORMAL

**Subscribers**:
- AnalyticsEngine: Track world state changes

---

### COMPANION AGGREGATE

#### CompanionChangedEvent (Seed defined, not published yet)
**Published By**: CompanionEngine (Future)
**Event Type**: COMPANION_CHANGED
**Aggregate Type**: COMPANION
**Priority**: NORMAL

**Subscribers**:
- RelationshipEngine: Update companion reference
- AnalyticsEngine: Track companion changes

---

#### CompanionStateChangedEvent (Seed defined, not published yet)
**Published By**: CompanionEngine (Future)
**Event Type**: COMPANION_STATE_CHANGED
**Aggregate Type**: COMPANION
**Priority**: NORMAL

**Subscribers**:
- NotificationEngine: Alert on status changes
- AnalyticsEngine: Track availability

---

### INTERACTION AGGREGATE

#### InteractionStartedEvent (Seed defined, not published yet)
**Published By**: InteractionEngine (Future)
**Event Type**: INTERACTION_STARTED
**Aggregate Type**: INTERACTION
**Priority**: NORMAL

**Subscribers**:
- RelationshipEngine: Begin tracking interaction
- AnalyticsEngine: Record session start

---

#### InteractionEndedEvent (Seed defined, not published yet)
**Published By**: InteractionEngine (Future)
**Event Type**: INTERACTION_ENDED
**Aggregate Type**: INTERACTION
**Priority**: NORMAL

**Subscribers**:
- RelationshipEngine: Calculate interaction quality
- AnalyticsEngine: Record session metrics

---

### PROMPT AGGREGATE

#### PromptBuiltEvent (Seed defined, not published yet)
**Published By**: PromptEngine (Future)
**Event Type**: PROMPT_BUILT
**Aggregate Type**: PROMPT
**Priority**: NORMAL

**Subscribers**:
- AnalyticsEngine: Track prompt generation
- HistoryEngine: Record prompt

---

### LLM AGGREGATE

#### LLMResponseGeneratedEvent (Seed defined, not published yet)
**Published By**: LLMEngine (Future)
**Event Type**: LLM_RESPONSE_GENERATED
**Aggregate Type**: PROMPT  (same as PROMPT for now)
**Priority**: NORMAL

**Subscribers**:
- RelationshipEngine: Process LLM output for interactions
- AnalyticsEngine: Track response quality

---

## Publisher → Subscriber Mapping

### Currently Implemented

| Publisher | Event | Subscribers | Status |
|-----------|-------|-------------|--------|
| RelationshipEngine | RELATIONSHIP_UPDATED | (None yet) | ✅ Publishing |
| RelationshipEngine | RELATIONSHIP_DIMENSION_CHANGED | (None yet) | ✅ Publishing |

### Seeds Implemented (Ready to Publish)

| Publisher | Event | Subscribers | Status |
|-----------|-------|-------------|--------|
| UserEngine | USER_CREATED | RelationshipEngine, AnalyticsEngine | 🔄 Awaiting UserEngine impl |
| RelationshipEngine | RELATIONSHIP_UPDATED | AnalyticsEngine, NotificationEngine | ✅ Publishing |
| RelationshipEngine | RELATIONSHIP_DIMENSION_CHANGED | AnalyticsEngine, NotificationEngine | ✅ Publishing |
| ConversationEngine | CONVERSATION_STARTED | RelationshipEngine, AnalyticsEngine | 🔄 Awaiting ConversationEngine |
| MessageEngine | MESSAGE_SENT | RelationshipEngine, AnalyticsEngine | 🔄 Awaiting MessageEngine |
| MemoryEngine | MEMORY_CREATED | RelationshipEngine, AnalyticsEngine | 🔄 Awaiting MemoryEngine |

### Event Handlers Registry

```typescript
// RelationshipEngine subscribes to:
- USER_CREATED (listen for new users)
- MEMORY_CREATED (update SHARED_MEMORIES dimension)
- MOMENT_TRIGGERED (record significant moments)

// AnalyticsEngine subscribes to:
- RELATIONSHIP_UPDATED (track relationship metrics)
- RELATIONSHIP_DIMENSION_CHANGED (analyze dimension evolution)
- CONVERSATION_STARTED (engagement tracking)
- MESSAGE_SENT (message pattern analysis)
- MEMORY_CREATED (memory creation rate)
- NOTIFICATION_SENT (delivery tracking)

// NotificationEngine subscribes to:
- RELATIONSHIP_DIMENSION_CHANGED (alert on major changes)
- MOMENT_TRIGGERED (notify user of moments)
- COMPANION_STATE_CHANGED (availability alerts)
- CONVERSATION_STARTED (optional greeting)

// HistoryEngine subscribes to:
- RELATIONSHIP_CREATED (record history)
- RELATIONSHIP_UPDATED (track state changes)
- RELATIONSHIP_DIMENSION_CHANGED (track evolution)
- MEMORY_CREATED (record memories)
- MESSAGE_SENT (conversation history)
```

---

## Event Publishing & Subscription Sequence

### Scenario: User Records Meaningful Interaction

```
1. RelationshipEngine.recordEvent()
   ├─ Updates dimensions
   ├─ Calculates changes
   │
   └─→ Publishes RELATIONSHIP_DIMENSION_CHANGED (TRUST +5)
        │
        ├─→ AnalyticsEngine Handler (Priority 5)
        │   └─ Tracks TRUST increase
        │
        ├─→ NotificationEngine Handler (Priority 3)
        │   └─ (No alert, not major enough)
        │
        └─→ HistoryEngine Handler (Priority 1)
            └─ Records dimension history

2. RelationshipEngine.recordEvent() continues
   │
   └─→ Publishes RELATIONSHIP_UPDATED
        │
        ├─→ AnalyticsEngine Handler (Priority 5)
        │   └─ Updates metrics dashboard
        │
        ├─→ NotificationEngine Handler (Priority 3)
        │   └─ (No alert unless status changed)
        │
        └─→ HistoryEngine Handler (Priority 1)
            └─ Records relationship state
```

---

## Extending with New Engines

### Adding a New Engine to Event-Driven Architecture

1. **Define Events** in EventEngine (seed events or new events)
2. **Create Handler** implementing `BaseEventHandler`
3. **Subscribe in Factory**:
   ```typescript
   const engine = new NewEngine({ eventEngine });
   eventEngine.subscribe(EventType.SOME_EVENT, new SomeHandler());
   ```
4. **Publish Events** when domain logic dictates
5. **Add to Event Catalog** documentation

### Example: Adding a MemoryEngine

```typescript
// Define MemoryCreatedHandler
class MemoryCreatedHandler extends BaseEventHandler<MemoryCreatedPayload> {
  constructor(private relationshipEngine: RelationshipEngine) {
    super(EventType.MEMORY_CREATED, 5, false);
  }

  protected async onEvent(envelope: EventEnvelope<MemoryCreatedPayload>): Promise<void> {
    const { companionId, importance } = envelope.payload;
    
    // Grow SHARED_MEMORIES dimension
    await this.relationshipEngine.growDimension(
      companionId,
      RelationshipDimensionType.SHARED_MEMORIES,
      importance || 3
    );
  }
}

// Subscribe in factory
const memoryEngine = new MemoryEngine({ eventEngine });
const handler = new MemoryCreatedHandler(relationshipEngine);
eventEngine.subscribe(EventType.MEMORY_CREATED, handler, 5);
```

---

## Testing Event-Driven Engines

### Unit Test Pattern

```typescript
it('should publish RELATIONSHIP_DIMENSION_CHANGED on update', async () => {
  let publishedEvent: EventEnvelope | null = null;

  // Mock EventEngine
  const mockEventEngine = {
    publish: jest.fn().mockImplementation((envelope) => {
      publishedEvent = envelope;
      return Promise.resolve(Result.success());
    }),
    subscribe: jest.fn(),
  };

  const engine = getRelationshipEngine({
    eventEngine: mockEventEngine as any,
  });

  await engine.recordEvent('user-1', 'companion-1', event);

  expect(mockEventEngine.publish).toHaveBeenCalled();
  expect(publishedEvent?.metadata.eventType).toBe(
    EventType.RELATIONSHIP_DIMENSION_CHANGED
  );
});
```

### Integration Test Pattern

```typescript
it('should trigger handlers on published event', async () => {
  const eventEngine = new EventEngine();
  const relationshipEngine = getRelationshipEngine({ eventEngine });
  
  let notificationSent = false;

  class TestHandler extends BaseEventHandler {
    protected async onEvent(): Promise<void> {
      notificationSent = true;
    }
  }

  eventEngine.subscribe(EventType.RELATIONSHIP_UPDATED, new TestHandler());

  await relationshipEngine.recordEvent('user-1', 'companion-1', event);

  // Wait for async handlers
  await new Promise(resolve => setTimeout(resolve, 100));

  expect(notificationSent).toBe(true);
});
```

---

## Migration Path from Tightly Coupled to Event-Driven

### Phase 1: Event Engine Ready ✅
- EventEngine implemented
- Seed events defined
- Base handlers ready

### Phase 2: Relationship Engine Publishing ✅
- RelationshipEngine publishes events
- Factory wired with EventEngine
- No consumers yet

### Phase 3: Add Event Handlers (Next)
- Create handlers for each event type
- Wire into factories
- Start consuming events

### Phase 4: Replace Other Engines
- Conversation Engine (add events)
- Memory Engine (add events)
- Notification Engine (add handlers)
- Analytics Engine (add handlers)

### Phase 5: Full Event Mesh
- All engines event-driven
- Replaceable with external brokers
- Observable via distributed tracing

---

## Performance Considerations

### Event Dispatch Modes
- **SYNC**: Blocks until all handlers complete (reliability)
- **ASYNC**: Non-blocking, scheduled immediately (performance)

### Ordering Guarantees
- Handlers execute in **priority order** (deterministic)
- Within same priority: **FIFO**
- No ordering across different event types

### Backpressure
- Handler errors don't block other handlers
- Retries use exponential backoff (avoid thundering herd)
- Dead letter queue prevents cascade failures

### Monitoring
- Metrics: published/processed/failed/dead-lettered
- Latency: average processing time per event
- Logging: structured logs for each event lifecycle

---

## Future Enhancements

1. **Event Sourcing**: Store all events as source of truth
2. **Sagas**: Multi-step workflows across engines
3. **Event Filtering**: Subscribe to event subsets
4. **Dead Letter Processor**: UI for replaying failed events
5. **Distributed Tracing**: OpenTelemetry integration
6. **Metrics Export**: Prometheus/Grafana integration
7. **Circuit Breaker**: Fail fast for consistently failing handlers
8. **Event Schema Registry**: Versioning and validation
