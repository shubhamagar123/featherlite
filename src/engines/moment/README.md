# Moment Engine

Consumes lifecycle events, produces meaningful, scheduled moments, and publishes `MOMENT_TRIGGERED` events for downstream engines (notably the Notification Engine).

## Event fan-in

Subscribes to:
- `MEMORY_CREATED`
- `RELATIONSHIP_UPDATED`
- `RELATIONSHIP_DIMENSION_CHANGED`
- `CONVERSATION_ENDED`
- `MESSAGE_SENT`

## Moment kinds

`MILESTONE`, `ANNIVERSARY`, `CALLBACK`, `FOLLOW_UP`, `REMINDER`, `CELEBRATION`, `REFLECTION`, `CHECK_IN`, `EMOTIONAL_SUPPORT`, `SHARED_INTEREST`.

## Public API

```ts
const engine = getMomentEngine();

// Reactive
engine.processEvent({ userId, companionId, eventType, eventPayload, now });

// Proactive
engine.scheduleAnniversary(userId, companionId, date, 'One year together');
engine.scheduleReminder(userId, companionId, remindAt, 'Take vitamins');
engine.scheduleCallback(userId, companionId, delayMs, 'Follow up on trip');
engine.scheduleFollowUp(userId, companionId, delayMs, 'Check on interview');
```

## Persistence

The engine is the source of truth for scheduling. It writes durable projections through the existing `MomentService` (fire-and-log so scheduling never blocks on persistence).
