# Event Engine - Architectural Decision Log

## ADR-001: Pub/Sub over Direct Engine Calls

**Decision**: Implement a publisher-subscriber (pub/sub) event bus rather than direct engine-to-engine method calls.

**Rationale**:
- Eliminates circular dependencies between engines
- Enables loose coupling: publishers don't know subscribers, subscribers don't know publishers
- Supports dynamic handler registration and unregistration
- Future-proofs for migration to external event brokers (Kafka, RabbitMQ)
- Simplifies testing through handler mocking

**Alternatives Considered**:
1. Direct method calls between engines → Tight coupling, circular dependencies
2. Message queue (immediate) → Overengineering for in-process use
3. Event sourcing store → Too complex for initial implementation

**Impact**:
- All inter-engine communication flows through EventEngine
- Handler execution order is predictable (priority-based)
- Enables testing without full engine instantiation

---

## ADR-002: Sync vs. Async Dispatch Modes

**Decision**: Support both synchronous and asynchronous dispatch modes, with sync as default.

**Rationale**:
- Sync: Ensures handlers complete before returning, useful for critical operations (user creation)
- Async: Non-blocking, scheduled for next event loop, suitable for notifications/logging
- Allows handlers to choose appropriate mode per event type
- Default to sync to catch errors immediately

**Implementation**:
```typescript
await engine.publish(envelope, EventDispatchMode.SYNC);   // Default
await engine.publish(envelope, EventDispatchMode.ASYNC);  // Fire-and-forget
```

**Tradeoffs**:
- Sync dispatch can slow down request handlers if subscribers are slow
- Async dispatch may miss errors (fire-and-forget)
- Mitigation: Dead letter queue captures async failures

---

## ADR-003: Priority-Based Handler Ordering

**Decision**: Sort handlers by priority (0-10 scale) and execute highest-priority first.

**Rationale**:
- Deterministic execution order (critical for tracing)
- Allows dependencies between handlers
- Example: Log handler (priority 1) runs after Notify handler (priority 10)
- Predictable for testing and debugging

**Priority Levels**:
- 0-2: Low priority (logging, analytics)
- 3-5: Normal priority (domain logic, state changes)
- 6-8: High priority (validation, critical updates)
- 9-10: Critical priority (consistency checks, system events)

**Tradeoffs**:
- Adds complexity to registry (O(n log n) sorting)
- Risk of priority inversion if not carefully managed
- Mitigation: Documentation and test cases

---

## ADR-004: Retry Strategy with Exponential Backoff

**Decision**: Implement configurable retry policy with exponential backoff and jitter.

**Rationale**:
- Network transients can cause temporary failures
- Exponential backoff prevents thundering herd
- Jitter distributes retries across time
- Max attempts prevent infinite loops
- Max delay caps retry duration

**Default Policy**:
```typescript
{
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  backoffJitter: true
}
```

**Calculation**:
```
retry 1: 100ms ± jitter
retry 2: 200ms ± jitter
retry 3: 400ms ± jitter
```

**Tradeoffs**:
- Delayed failure detection (can wait up to 700ms)
- May mask permanent errors temporarily
- Mitigation: Dead letter queue and monitoring

---

## ADR-005: Dead Letter Queue over Exceptions

**Decision**: Capture failed events in a dead letter queue rather than throwing exceptions.

**Rationale**:
- Preserves event metadata for debugging
- Enables replay of failed events
- Prevents cascade failures across handlers
- Observable and queryable failure history

**DLQ Entry Contains**:
- Original event envelope
- Failure reason
- Timestamp
- Handler metadata (which handlers ran)

**Recovery**:
- Operator can investigate and manually replay
- Events remain in DLQ until explicitly removed
- No automatic purging (requires explicit cleanup)

**Tradeoffs**:
- Memory usage (unbounded DLQ size possible)
- Operator awareness needed for recovery
- Mitigation: Monitoring alerts and size limits

---

## ADR-006: Loose Coupling via Interfaces

**Decision**: All components implement interfaces; no direct class dependencies.

**Rationale**:
- Enables testing via mock implementations
- Allows swapping implementations (e.g., EventBus → KafkaEventBus)
- Follows SOLID principles (Interface Segregation)
- Clear contracts between components

**Interfaces**:
- `IEventBus`: Message broker contract
- `IEventPublisher`: Publishing contract
- `IEventSubscriber`: Subscription contract
- `IEventHandler`: Handler execution contract
- `IEventRegistry`: Handler registry contract
- `IEventDispatcher`: Dispatch contract

**Tradeoffs**:
- More boilerplate code
- Slightly more complex to navigate
- Benefit: True ports-and-adapters architecture

---

## ADR-007: Envelope-Based Events

**Decision**: Wrap domain events in an `EventEnvelope` with metadata.

**Rationale**:
- Metadata enables correlation (tracing across systems)
- Separation of concerns (domain event ≠ transport event)
- Versioning support for event evolution
- Status tracking (pending, processing, published, failed)

**Envelope Structure**:
```typescript
EventEnvelope {
  metadata: EventMetadata      // Cross-cutting concerns
  aggregateId: string          // Business domain
  aggregateType: AggregateType // Business domain
  payload: T                    // Domain event data
  status: EventStatus          // Processing state
}
```

**Tradeoffs**:
- Extra layer of indirection
- Must manage envelope lifecycle
- Benefit: Clean separation of domain from infrastructure

---

## ADR-008: Correlation & Causation IDs

**Decision**: Support both correlation IDs (trace across requests) and causation IDs (event chains).

**Use Cases**:
- **Correlation**: Request → UserCreatedEvent → UserCreatedHandler chains
- **Causation**: UserCreatedEvent (causationId: X) → RelationshipCreatedEvent

**Propagation**:
- Correlation ID: Preserved across all events in a single request
- Causation ID: Set explicitly to link related events

**Example**:
```typescript
// Request context
const context = { correlationId: 'trace-123' };

// Event 1
const event1 = new UserCreatedEvent('user-1', payload, context);
await engine.publish(event1.getEnvelope());

// Event 2 (causally linked)
const event2 = EventFactory.withCausation(
  new RelationshipCreatedEvent(...),
  event1.getEventId()
);
await engine.publish(event2.getEnvelope());
```

**Benefits**:
- Full request tracing
- Cause-effect chains visible
- Distributed tracing compatibility (OpenTelemetry)

---

## ADR-009: Factory Pattern for Engine Creation

**Decision**: Use factory pattern with singleton caching for EventEngine.

**Rationale**:
- Single EventEngine instance per application
- Dependency injection for testing (override via factory)
- Lazy initialization
- Thread-safe caching

**Factory Interface**:
```typescript
export function getEventEngine(deps: EventEngineDeps = {}): EventEngine
export function resetEventEngine(): void
```

**Testing**:
```typescript
// Override retry policy for tests
const engine = getEventEngine({
  retryPolicy: { maxAttempts: 1, initialDelayMs: 0, ... }
});

// Reset after tests
resetEventEngine();
```

**Tradeoffs**:
- Global singleton (less testable without reset)
- Can override dependencies
- Benefit: Consistent engine throughout application

---

## ADR-010: BaseDomainEvent & BaseEventHandler

**Decision**: Provide base classes with common envelope/metadata handling.

**Rationale**:
- DRY principle (don't repeat envelope construction)
- Consistent validation pattern
- Built-in logging and error handling
- Type-safe payload access

**BaseDomainEvent**:
```typescript
export abstract class BaseDomainEvent<T> {
  protected abstract validate(): boolean;
  getEnvelope(): EventEnvelope<T>
  getMetadata(): EventMetadata
  getPayload(): T
  // ... accessor methods
}
```

**BaseEventHandler**:
```typescript
export abstract class BaseEventHandler<T> implements IEventHandler<T> {
  protected abstract onEvent(envelope: EventEnvelope<T>): Promise<void>
  getMetadata(): EventHandlerMetadata
  canHandle(envelope: EventEnvelope): boolean
  async handle(envelope: EventEnvelope<T>): Promise<IResult<void>>
}
```

**Tradeoffs**:
- Requires inheritance (not composition)
- May have unused methods
- Benefit: Reduces boilerplate in domain events

---

## ADR-011: In-Process Only (Initially)

**Decision**: Implement as in-process pub/sub only; design for future broker migration.

**Rationale**:
- Simpler initial implementation
- Sufficient for monolithic architecture
- Performance: No serialization/network overhead
- Clear migration path to external brokers

**Migration Path**:
1. In-process EventBus (current)
2. Alternative: KafkaEventBus implementing `IEventBus`
3. Swap in configuration, no business code changes

**Limitations**:
- Single process only (no horizontal scaling yet)
- No event persistence
- No inter-service communication

**Future**:
- Can add Kafka adapter without changing public API
- Event sourcing could layer on top

---

## ADR-012: Metrics Without External Dependency

**Decision**: Track simple metrics in-memory without Prometheus/StatsD dependency.

**Rationale**:
- No external dependencies
- Can add Prometheus exporter later
- Metrics available immediately via `getMetrics()`
- Performance counters sufficient for monitoring

**Tracked Metrics**:
- Published: Events sent to engine
- Processed: Events handled successfully
- Failed: Events with handler errors
- Retried: Retry attempts (cumulative)
- Dead Lettered: Events in DLQ
- Average Processing Time: Mean handler execution time

**Limitation**:
- Bounded history (last 1000 events)
- No percentiles/histograms yet

**Future**:
- Add Prometheus metrics adapter
- Detailed latency percentiles
- Per-handler metrics

---

## ADR-013: Generator-Based Event IDs

**Decision**: Use UUID v4 for event IDs, correlation IDs, and trace IDs.

**Rationale**:
- Globally unique (no central ID server)
- Distributed friendly
- Good for Kafka partitioning
- Industry standard

**Non-Goals**:
- Sequential IDs (would require coordination)
- Event sourcing event numbers (separate concern)

**Implementation**:
```typescript
import { randomUUID } from 'crypto';
const eventId = randomUUID(); // "550e8400-e29b-41d4-a716-446655440000"
```

---

## ADR-014: Handler Errors Don't Block Other Handlers

**Decision**: When one handler fails, other handlers still execute (only first error re-thrown).

**Rationale**:
- Prevents cascade failures
- All observers get a chance to react
- One bad subscriber doesn't break the system
- First error is captured for debugging

**Behavior**:
```
Handler A: Success
Handler B: Failure (caught)
Handler C: Success
→ DLQ contains: Handler B failure
→ publish() returns: Failure from Handler B
```

**Tradeoffs**:
- Only first error returned (others visible in logs/DLQ)
- Handlers can't depend on other handlers completing
- Benefit: System resilience

---

## ADR-015: Event Version for Schema Evolution

**Decision**: Include `version` in event metadata for future schema evolution.

**Rationale**:
- Enables non-breaking schema migrations
- Handler can dispatch based on version
- Compatibility checking possible
- Forward-compatibility layer ready

**Current Usage**:
```typescript
version: 1  // All events currently v1
```

**Future Usage**:
```typescript
switch(envelope.metadata.version) {
  case 1: handleV1(event); break;
  case 2: handleV2(event); break;
}
```

**Not Implemented Yet**:
- Schema registry
- Automatic versioning
- Migration helpers

---

## Summary Table

| Feature | Decision | Rationale |
|---------|----------|-----------|
| Coupling | Pub/Sub | Loose coupling, replaceable |
| Dispatch | Sync + Async | Flexibility per event |
| Ordering | Priority-based | Deterministic |
| Reliability | Retry + DLQ | Resilient without blocking |
| Uniqueness | UUID v4 | Global uniqueness |
| Isolation | In-process only | Simpler, migration-ready |
| Interfaces | All public contracts | True adapter pattern |
| Metrics | In-memory | Simple, Prometheus-ready |
| Error Handling | Result<T> monadic | Functional, compositional |

---

## Future Considerations

1. **Event Sourcing Integration**: Store all events for audit trail
2. **Kafka Adapter**: Scale to multiple processes
3. **Dead Letter Processor**: Automatic retry/replay UI
4. **Handler Groups**: Execute handlers transactionally
5. **Event Filtering**: Subscribe to event subsets (e.g., only HIGH priority)
6. **Snapshot Events**: Compress event history for large streams
7. **Circuit Breaker**: Fail fast for consistently failing handlers
8. **Saga Pattern**: Orchestrate multi-step workflows
