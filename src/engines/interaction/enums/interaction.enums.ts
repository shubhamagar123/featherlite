/** Interaction type (runtime architecture for all interaction modes). */
export enum InteractionType {
  TEXT_CHAT = 'TEXT_CHAT',
  VOICE_CALL = 'VOICE_CALL',
  ACTIVITY = 'ACTIVITY',
  PRESENCE = 'PRESENCE',
  TYPING = 'TYPING',
  STREAMING = 'STREAMING',
  INTERRUPTION = 'INTERRUPTION',
  SILENCE = 'SILENCE',
}

/** Interaction session state. */
export enum InteractionSessionState {
  IDLE = 'IDLE',
  INITIATED = 'INITIATED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/** Conversation exchange direction. */
export enum ExchangeDirection {
  USER_TO_COMPANION = 'USER_TO_COMPANION',
  COMPANION_TO_USER = 'COMPANION_TO_USER',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

/** Voice call state. */
export enum VoiceCallState {
  INCOMING = 'INCOMING',
  RINGING = 'RINGING',
  CONNECTED = 'CONNECTED',
  ON_HOLD = 'ON_HOLD',
  ENDED = 'ENDED',
  FAILED = 'FAILED',
  DECLINED = 'DECLINED',
}

/** Activity type for companion actions. */
export enum ActivityType {
  GAME = 'GAME',
  LEARNING = 'LEARNING',
  ENTERTAINMENT = 'ENTERTAINMENT',
  EXERCISE = 'EXERCISE',
  MINDFULNESS = 'MINDFULNESS',
  SOCIAL = 'SOCIAL',
}

/** Presence status. */
export enum PresenceStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
  INVISIBLE = 'INVISIBLE',
}

/** Interruption reason. */
export enum InterruptionReason {
  USER_INTERRUPT = 'USER_INTERRUPT',
  SYSTEM_INTERRUPT = 'SYSTEM_INTERRUPT',
  TIMEOUT = 'TIMEOUT',
  ERROR = 'ERROR',
  PRIORITY_CHANGE = 'PRIORITY_CHANGE',
}

/** Streaming state. */
export enum StreamingState {
  BUFFERING = 'BUFFERING',
  STREAMING = 'STREAMING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
  ERROR = 'ERROR',
}
