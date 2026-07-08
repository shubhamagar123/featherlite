import {
  InteractionType,
  InteractionSessionState,
  ExchangeDirection,
  VoiceCallState,
  ActivityType,
  PresenceStatus,
  InterruptionReason,
  StreamingState,
} from '../enums/interaction.enums';
import type { InteractionContextDTO } from '@engines/context';

/** Base interaction event. */
export interface InteractionEvent {
  id: string;
  type: InteractionType;
  sessionId: string;
  userId: string;
  companionId: string;
  timestamp: Date;
  duration?: number; // milliseconds
  metadata?: Record<string, unknown>;
}

/** Text chat message interaction. */
export interface TextChatInteraction extends InteractionEvent {
  type: InteractionType.TEXT_CHAT;
  message: string;
  direction: ExchangeDirection;
  parsed?: {
    intent?: string;
    entities?: Record<string, unknown>;
    sentiment?: string;
  };
}

/** Voice call interaction. */
export interface VoiceCallInteraction extends InteractionEvent {
  type: InteractionType.VOICE_CALL;
  state: VoiceCallState;
  audioUrl?: string;
  transcript?: string;
  durationSeconds?: number;
}

/** Activity interaction. */
export interface ActivityInteraction extends InteractionEvent {
  type: InteractionType.ACTIVITY;
  activityType: ActivityType;
  activityName: string;
  status: 'started' | 'in_progress' | 'completed' | 'paused' | 'abandoned';
  progress?: number; // 0-100
  score?: number;
}

/** Presence interaction (status change). */
export interface PresenceInteraction extends InteractionEvent {
  type: InteractionType.PRESENCE;
  status: PresenceStatus;
  statusMessage?: string;
  lastActivityAt?: Date;
}

/** Typing indicator interaction. */
export interface TypingInteraction extends InteractionEvent {
  type: InteractionType.TYPING;
  isTyping: boolean;
  estimatedLength?: number; // character count guess
}

/** Streaming response interaction. */
export interface StreamingInteraction extends InteractionEvent {
  type: InteractionType.STREAMING;
  state: StreamingState;
  contentType: string; // e.g., 'text/plain', 'audio/mpeg'
  streamUrl?: string;
  currentPosition?: number;
  totalLength?: number;
}

/** Interruption interaction. */
export interface InterruptionInteraction extends InteractionEvent {
  type: InteractionType.INTERRUPTION;
  reason: InterruptionReason;
  precedingInteractionId?: string;
  resolvedAt?: Date;
}

/** Silence/pause in interaction. */
export interface SilenceInteraction extends InteractionEvent {
  type: InteractionType.SILENCE;
  silenceDurationMs: number;
  context: 'between_messages' | 'during_call' | 'thinking_pause' | 'idle';
}

/** Union type for all interactions. */
export type AnyInteraction =
  | TextChatInteraction
  | VoiceCallInteraction
  | ActivityInteraction
  | PresenceInteraction
  | TypingInteraction
  | StreamingInteraction
  | InterruptionInteraction
  | SilenceInteraction;

/** Interaction session (groups related interactions). */
export interface InteractionSession {
  id: string;
  userId: string;
  companionId: string;
  state: InteractionSessionState;
  startedAt: Date;
  endedAt?: Date;
  interactions: AnyInteraction[];
  context: InteractionContextDTO;
  metadata?: Record<string, unknown>;
}

/** Request to process an interaction. */
export interface ProcessInteractionRequest {
  userId: string;
  companionId: string;
  interaction: AnyInteraction;
  context: InteractionContextDTO;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/** Result of processing an interaction. */
export interface ProcessInteractionResult {
  sessionId: string;
  interactionId: string;
  accepted: boolean;
  response?: string | Record<string, unknown>;
  nextAction?: string;
  estimatedDuration?: number;
  metadata?: Record<string, unknown>;
}

/** Summary of interactions in a session. */
export interface InteractionSessionSummary {
  sessionId: string;
  userId: string;
  companionId: string;
  duration: number;
  interactionCount: number;
  interactionTypes: InteractionType[];
  startedAt: Date;
  endedAt: Date;
  totalDurationMs: number;
  metadata?: Record<string, unknown>;
}
