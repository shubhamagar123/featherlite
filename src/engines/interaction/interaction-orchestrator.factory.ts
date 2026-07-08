/**
 * InteractionOrchestrator dependency injection factory.
 *
 * Manages composition root for interaction orchestration components.
 */

import { InteractionOrchestrator } from './interaction-orchestrator';
import { ConversationManager } from './managers/conversation.manager';
import { VoiceManager } from './managers/voice.manager';
import { ActivityManager } from './managers/activity.manager';
import { PresenceManager } from './managers/presence.manager';
import { SessionManager } from './managers/session.manager';
import { InterruptionManager } from './managers/interruption.manager';
import { StreamingManager } from './managers/streaming.manager';
import { TypingManager } from './managers/typing.manager';
import { SilenceManager } from './managers/silence.manager';

/** Dependency configuration for InteractionOrchestrator. */
export interface InteractionOrchestratorDeps {
  conversationManager?: ConversationManager;
  voiceManager?: VoiceManager;
  activityManager?: ActivityManager;
  presenceManager?: PresenceManager;
  sessionManager?: SessionManager;
  interruptionManager?: InterruptionManager;
  streamingManager?: StreamingManager;
  typingManager?: TypingManager;
  silenceManager?: SilenceManager;
}

let instance: InteractionOrchestrator | null = null;

/** Register and create InteractionOrchestrator with custom dependencies. */
export function registerInteractionOrchestrator(deps: InteractionOrchestratorDeps): void {
  const conversationManager = deps.conversationManager || new ConversationManager();
  const voiceManager = deps.voiceManager || new VoiceManager();
  const activityManager = deps.activityManager || new ActivityManager();
  const presenceManager = deps.presenceManager || new PresenceManager();
  const sessionManager = deps.sessionManager || new SessionManager();
  const interruptionManager = deps.interruptionManager || new InterruptionManager();
  const streamingManager = deps.streamingManager || new StreamingManager();
  const typingManager = deps.typingManager || new TypingManager();
  const silenceManager = deps.silenceManager || new SilenceManager();

  instance = new InteractionOrchestrator(
    conversationManager,
    voiceManager,
    activityManager,
    presenceManager,
    sessionManager,
    interruptionManager,
    streamingManager,
    typingManager,
    silenceManager
  );
}

/** Get or create the default InteractionOrchestrator instance. */
export function getInteractionOrchestrator(): InteractionOrchestrator {
  if (!instance) {
    registerInteractionOrchestrator({});
  }
  return instance!;
}

/** Reset the singleton instance. */
export function resetInteractionOrchestrator(): void {
  instance = null;
}
