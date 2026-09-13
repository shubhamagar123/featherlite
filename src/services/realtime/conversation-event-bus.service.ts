import { EventEmitter } from 'events';

export type ConversationLiveEventType =
  | 'kai:speaking_start'
  | 'kai:speaking_end'
  | 'video:state_change';

export interface ConversationLiveEvent {
  type: ConversationLiveEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * ConversationEventBus — an in-process pub/sub for live conversation state
 * (kai:speaking_start, kai:speaking_end, video:state_change), consumed by
 * the SSE endpoint at GET /api/v1/conversations/:id/events.
 *
 * This is transport plumbing, not a domain engine: whichever component
 * decides "Kai is now speaking" (e.g. the Conversation Engine after
 * starting TTS playback, or a future video/state manager) calls `publish()`
 * with the conversation id; this bus fans that out to every SSE connection
 * currently subscribed to that conversation.
 *
 * Single-process only — if the API scales to multiple instances, this needs
 * to move behind Redis pub/sub (the app already depends on Redis elsewhere)
 * so events reach subscribers connected to a different instance.
 */
export class ConversationEventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Many concurrent viewers of the same conversation is expected.
    this.emitter.setMaxListeners(0);
  }

  publish(conversationId: string, event: Omit<ConversationLiveEvent, 'timestamp'>): void {
    const fullEvent: ConversationLiveEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.emitter.emit(conversationId, fullEvent);
  }

  /** Returns an unsubscribe function. */
  subscribe(conversationId: string, listener: (event: ConversationLiveEvent) => void): () => void {
    this.emitter.on(conversationId, listener);
    return () => this.emitter.off(conversationId, listener);
  }
}

let cached: ConversationEventBus | null = null;

export function getConversationEventBus(): ConversationEventBus {
  if (!cached) {
    cached = new ConversationEventBus();
  }
  return cached;
}

export function resetConversationEventBus(): void {
  cached = null;
}
