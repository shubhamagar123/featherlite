# Notification Engine

Consumes `MOMENT_TRIGGERED` events and any direct `scheduleNotification` calls, then builds, throttles, schedules, and dispatches multi-channel notifications.

## Channels

`PUSH`, `EMAIL`, `IN_APP`, `SMS`. Each channel binds to a transport injected at the factory (`APNS/FCM`, `SMTP`, WebSocket/DB write, SMS gateway).

## Pipeline

```
NotificationRequest
    ↓
Throttler.allow()         — per-user per-min / per-hour / per-day caps
    ↓
Builder                    — render title/body from template + data
    ↓
Scheduler                  — dedupe + schedule
    ↓ (when due)
Dispatcher                 — parallel across channels with retry+backoff
    ↓ (on delivery)
NotificationService        — persist durable record
```

## Templates

`MOMENT_TRIGGERED`, `ANNIVERSARY`, `REMINDER`, `CALLBACK`, `RELATIONSHIP_MILESTONE`, `MEMORY_RECAP`, `GENERIC`.

## Analytics

```ts
const engine = getNotificationEngine();
const snap = engine.getAnalytics();
snap.totalScheduled;
snap.totalDelivered;
snap.byCategory.MOMENT;
snap.byChannel.PUSH;
```

## Retry policy

Default: 3 attempts, 500ms initial delay, ×2 backoff, capped at 5s. Overridable at construction.
