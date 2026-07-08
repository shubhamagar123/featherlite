import { EventType, EventPriority, EventStatus, AggregateType } from '../enums/event.enums';

export interface EventMetadata {
  eventId: string;
  eventName: string;
  eventType: EventType;
  version: number;
  occurredAt: Date;
  correlationId: string;
  causationId?: string;
  traceId?: string;
  userId?: string;
  companionId?: string;
  priority: EventPriority;
  source: string;
  environment: string;
}

export interface EventContext {
  userId?: string;
  companionId?: string;
  requestId?: string;
  correlationId: string;
  causationId?: string;
  traceId?: string;
}

export interface EventEnvelope<T = Record<string, any>> {
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

export interface DomainEventPayload {
  [key: string]: any;
}

export interface EventHandlerMetadata {
  handlerId: string;
  eventType: EventType;
  priority: number;
  async: boolean;
}

export interface DeadLetterEntry {
  envelope: EventEnvelope;
  reason: string;
  timestamp: Date;
  handlers?: EventHandlerMetadata[];
}

export interface EventRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  backoffJitter: boolean;
}

export interface EventMetrics {
  published: number;
  processed: number;
  failed: number;
  retried: number;
  deadLettered: number;
  averageProcessingTimeMs: number;
}
