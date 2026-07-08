/**
 * Interaction Engine public API.
 *
 * The Interaction Engine orchestrates all modes of interaction: text chat, voice
 * calls, activities, presence, typing, streaming, interruptions, and silence.
 * It is the runtime architecture for managing user-companion interactions.
 */

// Factory
export {
  getInteractionOrchestrator,
  registerInteractionOrchestrator,
  resetInteractionOrchestrator,
} from './interaction-orchestrator.factory';
export type { InteractionOrchestratorDeps } from './interaction-orchestrator.factory';

// Orchestrator
export { InteractionOrchestrator } from './interaction-orchestrator';

// Managers
export { ConversationManager } from './managers/conversation.manager';
export { VoiceManager } from './managers/voice.manager';
export { ActivityManager } from './managers/activity.manager';
export { PresenceManager } from './managers/presence.manager';
export { SessionManager } from './managers/session.manager';
export { InterruptionManager } from './managers/interruption.manager';
export { StreamingManager } from './managers/streaming.manager';
export { TypingManager } from './managers/typing.manager';
export { SilenceManager } from './managers/silence.manager';

// Interfaces
export type { IInteractionOrchestrator } from './interfaces/interaction-orchestrator.interface';
export type {
  IConversationManager,
  IVoiceManager,
  IActivityManager,
  IPresenceManager,
  ISessionManager,
  IInterruptionManager,
  IStreamingManager,
  ITypingManager,
  ISilenceManager,
} from './interfaces/interaction-manager.interface';

// DTOs
export type {
  InteractionEvent,
  TextChatInteraction,
  VoiceCallInteraction,
  ActivityInteraction,
  PresenceInteraction,
  TypingInteraction,
  StreamingInteraction,
  InterruptionInteraction,
  SilenceInteraction,
  AnyInteraction,
  InteractionSession,
  ProcessInteractionRequest,
  ProcessInteractionResult,
  InteractionSessionSummary,
} from './dtos/interaction.dtos';

// Enums
export {
  InteractionType,
  InteractionSessionState,
  ExchangeDirection,
  VoiceCallState,
  ActivityType,
  PresenceStatus,
  InterruptionReason,
  StreamingState,
} from './enums/interaction.enums';
