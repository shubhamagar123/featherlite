# Event Handler Registry

Complete mapping of all event handlers and their subscriptions.

## Handler Summary by Engine

| Engine | Handler Count | Subscribed Events | Status |
|--------|--------------|------------------|--------|
| RelationshipEngine | 5 | USER_CREATED, MEMORY_CREATED, MOMENT_TRIGGERED, (listening) | 🔄 Ready |
| AnalyticsEngine | 10+ | RELATIONSHIP_*, CONVERSATION_*, MESSAGE_*, MEMORY_*, NOTIFICATION_*, LLM_* | 🔄 Implementation |
| NotificationEngine | 8+ | RELATIONSHIP_DIMENSION_CHANGED, MOMENT_TRIGGERED, COMPANION_STATE_CHANGED, etc | 🔄 Implementation |
| HistoryEngine | 7+ | RELATIONSHIP_*, MEMORY_*, MESSAGE_*, CONVERSATION_*, NOTIFICATION_* | 🔄 Implementation |
| ConversationEngine | 4+ | MESSAGE_SENT, CONVERSATION_STARTED, RELATIONSHIP_UPDATED | 🔄 Implementation |

---

## Currently Implemented Handlers

### RelationshipEngine Handlers

#### 1. RelationshipDimensionChangeAnalyzer
- **Subscribes To**: RELATIONSHIP_DIMENSION_CHANGED
- **Priority**: 5
- **Async**: false
- **Responsibility**: 
  - Analyze dimension changes
  - Detect significant increases/decreases
  - Log trends
- **Status**: ✅ Ready (no explicit impl, uses domain logic)

#### 2. RelationshipStatusUpdater  
- **Subscribes To**: RELATIONSHIP_UPDATED
- **Priority**: 3
- **Async**: false
- **Responsibility**:
  - Update relationship status based on overall health
  - Update phase based on dimension thresholds
  - Trigger growth opportunities
- **Status**: ✅ Ready (part of updater logic)

---

## Planned Handlers (Ready for Implementation)

### AnalyticsEngine Handlers

#### RelationshipMetricsHandler
```typescript
EventType.RELATIONSHIP_UPDATED,
EventType.RELATIONSHIP_DIMENSION_CHANGED
```
- Track relationship metrics over time
- Calculate dimension velocity (rate of change)
- Identify relationship phases
- Generate analytics dashboards

#### ConversationEngagementHandler
```typescript
EventType.CONVERSATION_STARTED,
EventType.CONVERSATION_ENDED,
EventType.MESSAGE_SENT,
EventType.MESSAGE_RECEIVED
```
- Track conversation frequency
- Measure message rate
- Calculate engagement patterns
- Analyze conversation sentiment (future)

#### MemoryAnalyticsHandler
```typescript
EventType.MEMORY_CREATED,
EventType.MEMORY_EXPIRED
```
- Track memory creation rate
- Monitor memory decay patterns
- Identify important memories
- Measure memory engagement

#### NotificationTrackingHandler
```typescript
EventType.NOTIFICATION_SCHEDULED,
EventType.NOTIFICATION_SENT
```
- Track notification delivery
- Monitor notification engagement
- Measure click-through rates
- Identify optimal notification times

---

### NotificationEngine Handlers

#### DimensionChangeAlerter
```typescript
EventType.RELATIONSHIP_DIMENSION_CHANGED
```
- Alert on major dimension changes (+/- 10 points)
- Highlight critical dimensions (TRUST, COMFORT)
- Send contextual alerts
- Personalize alert content

#### MomentNotifier
```typescript
EventType.MOMENT_TRIGGERED
```
- Send significant moment alerts
- Include moment details
- Suggest follow-up actions
- Track moment engagement

#### StatusChangeNotifier
```typescript
EventType.COMPANION_STATE_CHANGED,
EventType.RELATIONSHIP_UPDATED
```
- Notify on companion availability
- Alert on relationship milestones
- Send status change summaries

---

### HistoryEngine Handlers

#### RelationshipHistoryRecorder
```typescript
EventType.RELATIONSHIP_UPDATED,
EventType.RELATIONSHIP_DIMENSION_CHANGED,
EventType.RELATIONSHIP_CREATED
```
- Store relationship events in history
- Maintain event audit trail
- Enable playback/replay
- Support time-series analysis

#### ConversationHistoryRecorder
```typescript
EventType.CONVERSATION_STARTED,
EventType.CONVERSATION_ENDED,
EventType.MESSAGE_SENT,
EventType.MESSAGE_RECEIVED
```
- Record full conversation history
- Index messages for search
- Enable conversation replay
- Support conversation analytics

#### MemoryHistoryRecorder
```typescript
EventType.MEMORY_CREATED,
EventType.MEMORY_EXPIRED
```
- Record memory lifecycle
- Archive expired memories
- Support memory search
- Enable memory analysis

---

## Handler Subscription Patterns

### Pattern 1: Single Event Listener
```typescript
class DimensionChangeAlerter extends BaseEventHandler {
  constructor() {
    super(EventType.RELATIONSHIP_DIMENSION_CHANGED, 5, false);
  }
  
  protected async onEvent(envelope: EventEnvelope): Promise<void> {
    // Handle single event type
  }
}

// Subscribe
eventEngine.subscribe(EventType.RELATIONSHIP_DIMENSION_CHANGED, handler, 5);
```

### Pattern 2: Multi-Event Orchestrator
```typescript
class RelationshipOrchestrator {
  constructor(private eventEngine: EventEngine) {
    // Subscribe to multiple events
    this.eventEngine.subscribe(EventType.RELATIONSHIP_UPDATED, 
      new RelationshipUpdateHandler(), 5);
    this.eventEngine.subscribe(EventType.RELATIONSHIP_DIMENSION_CHANGED,
      new DimensionChangeHandler(), 5);
    this.eventEngine.subscribe(EventType.MEMORY_CREATED,
      new MemoryHandler(), 3);
  }
}
```

### Pattern 3: Event Router/Dispatcher
```typescript
class AnalyticsRouter extends BaseEventHandler {
  constructor(private analytics: AnalyticsService) {
    super(EventType.RELATIONSHIP_UPDATED, 5, true); // Async
  }

  protected async onEvent(envelope: EventEnvelope): Promise<void> {
    switch(envelope.metadata.eventType) {
      case EventType.RELATIONSHIP_UPDATED:
        await this.analytics.trackRelationshipUpdate(envelope.payload);
        break;
      case EventType.RELATIONSHIP_DIMENSION_CHANGED:
        await this.analytics.trackDimensionChange(envelope.payload);
        break;
    }
  }
}

// Must subscribe separately for each event type
eventEngine.subscribe(EventType.RELATIONSHIP_UPDATED, router, 5);
eventEngine.subscribe(EventType.RELATIONSHIP_DIMENSION_CHANGED, router, 5);
```

---

## Handler Priority Guidelines

| Priority | Use Cases | Examples |
|----------|-----------|----------|
| 9-10 (Critical) | System integrity | Validation, consistency checks, circuit breakers |
| 6-8 (High) | Core logic | Dimension updates, status changes, state mutations |
| 3-5 (Normal) | Standard handlers | Notifications, analytics, logging |
| 0-2 (Low) | Non-critical | Analytics, debugging, telemetry |

### Priority Assignment Rules
1. **Critical** (9-10): Handlers that enforce business rules
2. **High** (6-8): Handlers that drive core domain logic
3. **Normal** (3-5): Handlers that provide standard functionality
4. **Low** (0-2): Handlers that support but don't drive logic

### Example Priority Chain for RELATIONSHIP_DIMENSION_CHANGED
```
Priority 10: Validation Handler
  └─ Verify change is within bounds

Priority 7: Consistency Handler
  └─ Update related dimensions

Priority 5: Analytics Handler
  └─ Track metrics

Priority 3: Notification Handler
  └─ Alert user

Priority 1: Logging Handler
  └─ Log for debugging
```

---

## Handler Error Handling

### OnError Callback

Every handler can define error handling:

```typescript
class RobustHandler extends BaseEventHandler {
  protected async onEvent(envelope: EventEnvelope): Promise<void> {
    // Business logic
  }

  async onError(envelope: EventEnvelope, error: Error): Promise<void> {
    // Graceful error handling
    logger.error({
      eventId: envelope.metadata.eventId,
      error: error.message,
    }, 'Handler error');

    // Could:
    // - Send error alerts
    // - Attempt recovery
    // - Log to error tracking
    // - Queue for retry
  }
}
```

### Error Recovery Strategy

1. **Sync Handlers**
   - Errors block publication (fail fast)
   - Moved to Dead Letter Queue
   - Requires manual retry/replay

2. **Async Handlers**
   - Errors don't block publication
   - Retry automatically with backoff
   - Moved to DLQ after max retries

3. **Dead Letter Queue**
   - Inspect failed events
   - Understand failure reason
   - Manually replay after fix
   - Optional: Automated recovery

---

## Testing Handlers

### Unit Test Template

```typescript
describe('DimensionChangeAlerter', () => {
  it('should send alert on major dimension change', async () => {
    const mockNotification = jest.fn();
    const handler = new DimensionChangeAlerter(mockNotification);

    const envelope = EventFactory.createEnvelope(
      'rel-1',
      AggregateType.RELATIONSHIP,
      EventType.RELATIONSHIP_DIMENSION_CHANGED,
      'Dimension Changed',
      {
        userId: 'user-1',
        companionId: 'comp-1',
        dimension: 'TRUST',
        oldValue: 50,
        newValue: 70,  // +20 = major change
        change: 20,
        reason: 'Positive interaction'
      },
      EventContextBuilder.create().build()
    );

    const result = await handler.handle(envelope);

    expect(result.isSuccess).toBe(true);
    expect(mockNotification).toHaveBeenCalledWith(
      expect.objectContaining({ dimension: 'TRUST' })
    );
  });

  it('should not alert on minor dimension change', async () => {
    // Similar setup with change: +3
    // Expect no alert
  });

  it('should handle errors gracefully', async () => {
    // Trigger error in notification
    // Verify onError is called
    // Verify error is logged
  });
});
```

### Integration Test Template

```typescript
describe('RelationshipEngine with Handlers', () => {
  it('should trigger all handlers on dimension change', async () => {
    const eventEngine = new EventEngine();
    const relationshipEngine = getRelationshipEngine({ eventEngine });

    let analyticsNotified = false;
    let notificationSent = false;
    let historyRecorded = false;

    class TestAnalyticsHandler extends BaseEventHandler {
      protected async onEvent(): Promise<void> {
        analyticsNotified = true;
      }
    }

    class TestNotificationHandler extends BaseEventHandler {
      protected async onEvent(): Promise<void> {
        notificationSent = true;
      }
    }

    class TestHistoryHandler extends BaseEventHandler {
      protected async onEvent(): Promise<void> {
        historyRecorded = true;
      }
    }

    eventEngine.subscribe(EventType.RELATIONSHIP_DIMENSION_CHANGED,
      new TestAnalyticsHandler(), 5);
    eventEngine.subscribe(EventType.RELATIONSHIP_DIMENSION_CHANGED,
      new TestNotificationHandler(), 3);
    eventEngine.subscribe(EventType.RELATIONSHIP_DIMENSION_CHANGED,
      new TestHistoryHandler(), 1);

    await relationshipEngine.recordEvent('user-1', 'comp-1', event);

    // Wait for async handlers
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(analyticsNotified).toBe(true);
    expect(notificationSent).toBe(true);
    expect(historyRecorded).toBe(true);
  });
});
```

---

## Handler Deployment Checklist

- [ ] Handler implements `BaseEventHandler`
- [ ] `onEvent()` method implements business logic
- [ ] `onError()` method handles failures gracefully
- [ ] Handler has appropriate priority (0-10)
- [ ] Handler async flag matches expected behavior
- [ ] Handler subscribed in engine factory
- [ ] Unit tests cover success and error paths
- [ ] Integration tests verify handler triggers
- [ ] Handler errors logged with context
- [ ] Performance acceptable (no blocking operations)
- [ ] Handler can be disabled/toggled (optional)
- [ ] Documentation updated with handler details

---

## Future Handler Patterns

### 1. Saga Handler (Orchestration)
```typescript
class RelationshipSaga extends BaseEventHandler {
  // Multi-step business process
  // Compensating transactions
  // Eventual consistency
}
```

### 2. Projector Handler (CQRS)
```typescript
class RelationshipProjector extends BaseEventHandler {
  // Build read model from events
  // Denormalized views
  // Materialized snapshots
}
```

### 3. Policy Handler (Business Rules)
```typescript
class RelationshipPolicy extends BaseEventHandler {
  // Enforce business rules
  // Gate state transitions
  // Validate invariants
}
```

### 4. Aggregate Handler (Event Sourcing)
```typescript
class RelationshipAggregateHandler extends BaseEventHandler {
  // Rebuild aggregate from events
  // Verify event sequence
  // Detect anomalies
}
```

---

## Monitoring Handler Performance

### Metrics Tracked

```typescript
interface HandlerMetrics {
  handlerId: string;
  eventType: EventType;
  totalHandled: number;
  totalFailed: number;
  totalRetried: number;
  averageExecutionTimeMs: number;
  maxExecutionTimeMs: number;
  lastExecutedAt: Date;
}
```

### Dashboards

- **Handler Performance**: Execution time per handler
- **Handler Reliability**: Success/failure rates
- **Event Throughput**: Events/sec per type
- **Handler Latency**: P50/P95/P99 execution times

### Alerts

- Handler error rate > 5%
- Handler execution time > 1000ms
- Handler consecutively failing (circuit breaker)
- Dead Letter Queue growth

---

## Production Considerations

### Graceful Degradation
- Non-critical handlers can be disabled
- Core handlers have fallbacks
- Errors don't cascade

### Scalability
- Handlers can be async for non-blocking
- Dead letter queue enables retry storms prevention
- Handler isolation prevents coupling

### Observability
- Structured logging for each handler
- Metrics per handler type
- Distributed tracing support
- Dead letter queue visibility

### Resilience
- Retry logic with backoff
- Circuit breakers for failing services
- Timeout enforcement
- Graceful timeout handling
