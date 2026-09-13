/** The 12 independent relationship dimensions. */
export enum RelationshipDimensionType {
  TRUST = 'TRUST',
  COMFORT = 'COMFORT',
  PLAYFULNESS = 'PLAYFULNESS',
  EMOTIONAL_DEPTH = 'EMOTIONAL_DEPTH',
  COMMUNICATION_STYLE = 'COMMUNICATION_STYLE',
  SHARED_RITUALS = 'SHARED_RITUALS',
  SHARED_MEMORIES = 'SHARED_MEMORIES',
  BOUNDARIES = 'BOUNDARIES',
  FAMILIARITY = 'FAMILIARITY',
  RELIABILITY = 'RELIABILITY',
  SUPPORTIVENESS = 'SUPPORTIVENESS',
  RESPECT = 'RESPECT',
}

/**
 * Relationship lifecycle status. This is NOT a closeness measure — it only
 * tracks whether the relationship is currently active, paused, or ended.
 * How close a relationship is gets read live from raw signals (see
 * RelationshipClosenessSignals) rather than encoded as a named stage here.
 */
export enum RelationshipStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

/** Event types that impact relationship. */
export enum RelationshipEventType {
  CONVERSATION = 'CONVERSATION',
  SHARED_MOMENT = 'SHARED_MOMENT',
  MEMORY_CREATED = 'MEMORY_CREATED',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
  CONFLICT = 'CONFLICT',
  REPAIR = 'REPAIR',
  RITUAL_ESTABLISHED = 'RITUAL_ESTABLISHED',
  JOKE_SHARED = 'JOKE_SHARED',
  BOUNDARY_SET = 'BOUNDARY_SET',
  CONSISTENCY_MAINTAINED = 'CONSISTENCY_MAINTAINED',
}

/** Interaction quality assessment. */
export enum InteractionQuality {
  SUPERFICIAL = 'SUPERFICIAL',
  CASUAL = 'CASUAL',
  ENGAGED = 'ENGAGED',
  MEANINGFUL = 'MEANINGFUL',
  PROFOUND = 'PROFOUND',
}

/** Dimension value progression. */
export enum DimensionChange {
  SIGNIFICANTLY_DECREASED = -2,
  DECREASED = -1,
  STABLE = 0,
  INCREASED = 1,
  SIGNIFICANTLY_INCREASED = 2,
}

/** Growth strategy type. */
export enum GrowthStrategyType {
  CONVERSATION_FREQUENCY = 'CONVERSATION_FREQUENCY',
  CONVERSATION_QUALITY = 'CONVERSATION_QUALITY',
  SHARED_EXPERIENCES = 'SHARED_EXPERIENCES',
  EMOTIONAL_VULNERABILITY = 'EMOTIONAL_VULNERABILITY',
  CONSISTENCY = 'CONSISTENCY',
  CONFLICT_RESOLUTION = 'CONFLICT_RESOLUTION',
}
