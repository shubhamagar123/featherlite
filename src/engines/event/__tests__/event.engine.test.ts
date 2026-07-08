import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EventEngine } from '../event.engine';
import { EventFactory } from '../core/event-factory';
import { EventContextBuilder } from '../core/event-context';
import { BaseEventHandler } from '../contracts/base-event-handler';
import { EventEnvelope } from '../dto/event.dto';
import { EventType, AggregateType, EventDispatchMode, EventPriority } from '../enums/event.enums';
import { UserCreatedEvent } from '../events/user-created.event';
import { RelationshipUpdatedEvent } from '../events/relationship-updated.event';

describe('EventEngine', () => {
  let engine: EventEngine;

  beforeEach(() => {
    engine = new EventEngine();
  });

  afterEach(() => {
    engine.reset();
  });

  describe('Event Publishing', () => {
    it('should publish an event synchronously', async () => {
      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context,
        EventPriority.NORMAL
      );

      const result = await engine.publish(envelope, EventDispatchMode.SYNC);

      expect(result.isSuccess).toBe(true);
      expect(engine.getMetrics().published).toBe(1);
    });

    it('should publish an event asynchronously', async () => {
      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      const result = await engine.publish(envelope, EventDispatchMode.ASYNC);

      expect(result.isSuccess).toBe(true);
      expect(engine.getMetrics().published).toBe(1);
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe handler to event type', () => {
      let eventHandled = false;

      class TestHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED, 1, false);
        }

        protected async onEvent(): Promise<void> {
          eventHandled = true;
        }
      }

      const handler = new TestHandler();
      const subscriptionId = engine.subscribe(EventType.USER_CREATED, handler);

      expect(subscriptionId).toBeTruthy();
      expect(subscriptionId.length).toBeGreaterThan(0);
    });

    it('should unsubscribe handler from event type', () => {
      class TestHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED);
        }

        protected async onEvent(): Promise<void> {}
      }

      const handler = new TestHandler();
      const subscriptionId = engine.subscribe(EventType.USER_CREATED, handler);

      const unsubResult = engine.unsubscribe(EventType.USER_CREATED, subscriptionId);

      expect(unsubResult.isSuccess).toBe(true);
    });

    it('should handle event with registered handler', async () => {
      let handledEventId: string | null = null;

      class TestHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED);
        }

        protected async onEvent(envelope: EventEnvelope): Promise<void> {
          handledEventId = envelope.metadata.eventId;
        }
      }

      const handler = new TestHandler();
      engine.subscribe(EventType.USER_CREATED, handler);

      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      await engine.publish(envelope, EventDispatchMode.SYNC);

      expect(handledEventId).toBe(envelope.metadata.eventId);
      expect(engine.getMetrics().processed).toBe(1);
    });

    it('should support multiple handlers per event type', async () => {
      let handler1Called = false;
      let handler2Called = false;

      class Handler1 extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED, 1);
        }

        protected async onEvent(): Promise<void> {
          handler1Called = true;
        }
      }

      class Handler2 extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED, 2);
        }

        protected async onEvent(): Promise<void> {
          handler2Called = true;
        }
      }

      engine.subscribe(EventType.USER_CREATED, new Handler1());
      engine.subscribe(EventType.USER_CREATED, new Handler2());

      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      await engine.publish(envelope, EventDispatchMode.SYNC);

      expect(handler1Called).toBe(true);
      expect(handler2Called).toBe(true);
      expect(engine.getMetrics().processed).toBe(1);
    });

    it('should respect handler priority order', async () => {
      const order: number[] = [];

      class Handler1 extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED, 1);
        }

        protected async onEvent(): Promise<void> {
          order.push(1);
        }
      }

      class Handler2 extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED, 5);
        }

        protected async onEvent(): Promise<void> {
          order.push(2);
        }
      }

      engine.subscribe(EventType.USER_CREATED, new Handler1(), 1);
      engine.subscribe(EventType.USER_CREATED, new Handler2(), 5);

      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      const result = await engine.publish(envelope, EventDispatchMode.SYNC);

      expect(result.isSuccess).toBe(true);
      expect(order.length).toBe(2);
      expect(order[0]).toBe(2);
      expect(order[1]).toBe(1);
      expect(engine.getMetrics().processed).toBe(1);
    });
  });

  describe('Event Context', () => {
    it('should preserve correlation ID across events', async () => {
      let receivedCorrelationId: string | null = null;

      class TestHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED);
        }

        protected async onEvent(envelope: EventEnvelope): Promise<void> {
          receivedCorrelationId = envelope.metadata.correlationId;
        }
      }

      const correlationId = 'test-correlation-123';
      const context = EventContextBuilder.create()
        .withUserId('user-1')
        .withCorrelationId(correlationId)
        .build();

      engine.subscribe(EventType.USER_CREATED, new TestHandler());

      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      await engine.publish(envelope, EventDispatchMode.SYNC);

      expect(receivedCorrelationId).toBe(correlationId);
    });

    it('should support causation ID for event chains', async () => {
      const causationId = 'event-123';
      const context = EventContextBuilder.create()
        .withUserId('user-1')
        .withCausationId(causationId)
        .build();

      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      expect(envelope.metadata.causationId).toBe(causationId);
    });
  });

  describe('Dead Letter Queue', () => {
    it('should move failed event to dead letter queue', async () => {
      class FailingHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED);
        }

        protected async onEvent(): Promise<void> {
          throw new Error('Handler error');
        }
      }

      engine.subscribe(EventType.USER_CREATED, new FailingHandler());

      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      await engine.publish(envelope, EventDispatchMode.SYNC);

      const dlq = engine.getDeadLetterQueue();
      expect(dlq.length).toBeGreaterThan(0);
    });

    it('should provide dead letter queue entries with reason', async () => {
      class FailingHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED);
        }

        protected async onEvent(): Promise<void> {
          throw new Error('Test error');
        }
      }

      engine.subscribe(EventType.USER_CREATED, new FailingHandler());

      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      await engine.publish(envelope, EventDispatchMode.SYNC);

      const dlq = engine.getDeadLetterQueue();
      expect(dlq.length).toBeGreaterThan(0);
      expect(dlq[0].reason).toBeTruthy();
      expect(dlq[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Metrics', () => {
    it('should track published events', async () => {
      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      await engine.publish(envelope);

      const metrics = engine.getMetrics();
      expect(metrics.published).toBe(1);
    });

    it('should track processed events', async () => {
      class TestHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED);
        }

        protected async onEvent(): Promise<void> {}
      }

      engine.subscribe(EventType.USER_CREATED, new TestHandler());

      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      await engine.publish(envelope);

      const metrics = engine.getMetrics();
      expect(metrics.processed).toBe(1);
    });

    it('should calculate average processing time', async () => {
      class TestHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED);
        }

        protected async onEvent(): Promise<void> {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      engine.subscribe(EventType.USER_CREATED, new TestHandler());

      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      await engine.publish(envelope);

      const metrics = engine.getMetrics();
      expect(metrics.averageProcessingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Domain Events', () => {
    it('should handle UserCreatedEvent', async () => {
      let eventPayload: any = null;

      class TestHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED);
        }

        protected async onEvent(envelope: EventEnvelope): Promise<void> {
          eventPayload = envelope.payload;
        }
      }

      engine.subscribe(EventType.USER_CREATED, new TestHandler());

      const context = EventContextBuilder.create().withUserId('user-1').build();
      const event = new UserCreatedEvent('user-1', {
        username: 'john',
        email: 'john@example.com',
        displayName: 'John Doe',
      }, context);

      await engine.publish(event.getEnvelope());

      expect(eventPayload.username).toBe('john');
      expect(eventPayload.email).toBe('john@example.com');
    });

    it('should handle RelationshipUpdatedEvent', async () => {
      let eventPayload: any = null;

      class TestHandler extends BaseEventHandler {
        constructor() {
          super(EventType.RELATIONSHIP_UPDATED);
        }

        protected async onEvent(envelope: EventEnvelope): Promise<void> {
          eventPayload = envelope.payload;
        }
      }

      engine.subscribe(EventType.RELATIONSHIP_UPDATED, new TestHandler());

      const context = EventContextBuilder.create()
        .withUserId('user-1')
        .withCompanionId('companion-1')
        .build();

      const event = new RelationshipUpdatedEvent('rel-1', {
        userId: 'user-1',
        companionId: 'companion-1',
        status: 'ESTABLISHED',
        phase: 'DEEPENING',
        overallHealth: 75,
        trajectory: 2.5,
      }, context);

      await engine.publish(event.getEnvelope());

      expect(eventPayload.overallHealth).toBe(75);
      expect(eventPayload.trajectory).toBe(2.5);
    });
  });

  describe('Reset', () => {
    it('should reset all state', async () => {
      class TestHandler extends BaseEventHandler {
        constructor() {
          super(EventType.USER_CREATED);
        }

        protected async onEvent(): Promise<void> {}
      }

      engine.subscribe(EventType.USER_CREATED, new TestHandler());

      const context = EventContextBuilder.create().withUserId('user-1').build();
      const envelope = EventFactory.createEnvelope(
        'user-1',
        AggregateType.USER,
        EventType.USER_CREATED,
        'User Created',
        { username: 'john', email: 'john@example.com' },
        context
      );

      await engine.publish(envelope);

      engine.reset();

      const metrics = engine.getMetrics();
      expect(metrics.published).toBe(0);
      expect(metrics.processed).toBe(0);
      expect(engine.getDeadLetterQueue().length).toBe(0);
    });
  });
});
