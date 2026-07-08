/**
 * Manager interfaces for different interaction types.
 */

import { IResult } from '@services/types/result.type';
import {
  TextChatInteraction,
  VoiceCallInteraction,
  ActivityInteraction,
  PresenceInteraction,
  TypingInteraction,
  StreamingInteraction,
  InterruptionInteraction,
  SilenceInteraction,
} from '../dtos/interaction.dtos';
import type { InteractionContextDTO } from '@engines/context';

/** Manages text-based conversations. */
export interface IConversationManager {
  processMessage(
    interaction: TextChatInteraction,
    context: InteractionContextDTO
  ): Promise<IResult<string>>;
  analyzeMessage(message: string): Promise<IResult<Record<string, unknown>>>;
}

/** Manages voice call interactions. */
export interface IVoiceManager {
  initiateCall(
    userId: string,
    companionId: string,
    context: InteractionContextDTO
  ): Promise<IResult<VoiceCallInteraction>>;
  handleCallState(interaction: VoiceCallInteraction): Promise<IResult<void>>;
  transcribeAudio(audioUrl: string): Promise<IResult<string>>;
}

/** Manages companion activities. */
export interface IActivityManager {
  startActivity(
    interaction: ActivityInteraction,
    context: InteractionContextDTO
  ): Promise<IResult<void>>;
  updateActivityProgress(
    activityId: string,
    progress: number
  ): Promise<IResult<ActivityInteraction>>;
  completeActivity(
    activityId: string
  ): Promise<IResult<ActivityInteraction>>;
}

/** Manages companion presence and availability. */
export interface IPresenceManager {
  updatePresence(
    interaction: PresenceInteraction,
    context: InteractionContextDTO
  ): Promise<IResult<void>>;
  getPresence(userId: string, companionId: string): Promise<IResult<PresenceInteraction>>;
}

/** Manages interaction sessions. */
export interface ISessionManager {
  createSession(userId: string, companionId: string): Promise<IResult<string>>;
  addInteractionToSession(sessionId: string, interaction: object): Promise<IResult<void>>;
  endSession(sessionId: string): Promise<IResult<void>>;
  getSession(sessionId: string): Promise<IResult<object>>;
}

/** Manages interaction interruptions. */
export interface IInterruptionManager {
  handleInterruption(interaction: InterruptionInteraction): Promise<IResult<void>>;
  resolveInterruption(interruptionId: string): Promise<IResult<void>>;
}

/** Manages streaming responses. */
export interface IStreamingManager {
  startStream(
    interaction: StreamingInteraction,
    context: InteractionContextDTO
  ): Promise<IResult<void>>;
  updateStreamState(
    streamId: string,
    state: string
  ): Promise<IResult<StreamingInteraction>>;
  endStream(streamId: string): Promise<IResult<void>>;
}

/** Detects and reports typing activity. */
export interface ITypingManager {
  reportTyping(interaction: TypingInteraction): Promise<IResult<void>>;
}

/** Manages silence/pause interactions. */
export interface ISilenceManager {
  recordSilence(interaction: SilenceInteraction): Promise<IResult<void>>;
  analyzeSilence(interaction: SilenceInteraction): Promise<IResult<Record<string, unknown>>>;
}
