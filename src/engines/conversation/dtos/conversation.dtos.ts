/**
 * A single user turn to process.
 */
export interface ConversationTurnInput {
  userId: string;
  companionId: string;
  /**
   * Groups turns into one conversation so a consent question asked on one
   * turn can be resolved on the next. Defaults to `${userId}:${companionId}`
   * when omitted (i.e. "one active conversation per user-companion pair").
   */
  sessionId?: string;
  /**
   * Unique id for this exact message. Carried into any
   * MemoryExtractionResultDTO produced from it, and into the ConsentEvent
   * that later persists (or discards) it — this is how a "yes" on turn N+1
   * ties back to the specific candidate proposed on turn N.
   */
  messageId: string;
  message: string;
  timezone?: string;
  conversationHistory?: string;
}

/** What happened to a consent question asked on a previous turn. */
export interface ConsentResolution {
  granted: boolean;
  /** True only if MemoryService actually wrote a row. */
  persisted: boolean;
}

export interface ConversationTurnResult {
  /** The companion's reply for this turn — may have a consent question appended. */
  reply: string;
  /** True when this reply had an in-character consent question appended. */
  consentQuestionAsked: boolean;
  /**
   * Present only when this turn's message resolved a consent question asked
   * on the previous turn (i.e. there was a pending candidate).
   */
  consentResolution?: ConsentResolution;
}
