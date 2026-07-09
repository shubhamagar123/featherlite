import { IEventRegistry } from '../interfaces/event-bus.interface';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { EventType } from '../enums/event.enums';
import { randomUUID } from 'crypto';
import { IdempotencyMiddleware } from './idempotency-middleware';

interface HandlerEntry {
  handler: IEventHandler;
  priority: number;
  subscriptionId: string;
}

export class EventRegistry implements IEventRegistry {
  private handlers: Map<EventType, HandlerEntry[]> = new Map();
  private enableIdempotency: boolean = true;

  constructor(enableIdempotency: boolean = true) {
    this.enableIdempotency = enableIdempotency;
  }

  setIdempotency(enabled: boolean): void {
    this.enableIdempotency = enabled;
  }

  register(eventType: EventType, handler: IEventHandler, priority: number = 1): string {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const subscriptionId = randomUUID();
    const wrappedHandler = this.enableIdempotency ? new IdempotencyMiddleware(handler) : handler;
    const entry: HandlerEntry = { handler: wrappedHandler, priority: Math.max(0, Math.min(10, priority)), subscriptionId };

    const handlerList = this.handlers.get(eventType)!;
    handlerList.push(entry);
    handlerList.sort((a, b) => b.priority - a.priority);

    return subscriptionId;
  }

  unregister(eventType: EventType, subscriptionId: string): boolean {
    const handlers = this.handlers.get(eventType);
    if (!handlers) {
      return false;
    }

    const initialLength = handlers.length;
    const filtered = handlers.filter(h => h.subscriptionId !== subscriptionId);

    if (filtered.length === initialLength) {
      return false;
    }

    if (filtered.length === 0) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.set(eventType, filtered);
    }

    return true;
  }

  getHandlers(eventType: EventType): Array<{ handler: IEventHandler; priority: number }> {
    const handlers = this.handlers.get(eventType) || [];
    return handlers.map(h => ({ handler: h.handler, priority: h.priority }));
  }

  getAllHandlers(): Map<EventType, Array<{ handler: IEventHandler; priority: number }>> {
    const result = new Map<EventType, Array<{ handler: IEventHandler; priority: number }>>();

    for (const [eventType, handlers] of this.handlers) {
      result.set(
        eventType,
        handlers.map(h => ({ handler: h.handler, priority: h.priority }))
      );
    }

    return result;
  }

  clear(): void {
    this.handlers.clear();
  }

  getSubscriberCount(eventType?: EventType): number {
    if (eventType) {
      return (this.handlers.get(eventType) || []).length;
    }

    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.length;
    }
    return total;
  }
}
