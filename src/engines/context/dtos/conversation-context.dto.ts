/**
 * Interaction Context DTOs.
 *
 * The `InteractionContextDTO` is the single, self-contained object the
 * Interaction Engine consumes. It is assembled by the Context Engine from
 * independent providers. The Interaction Engine must NEVER reach past this
 * object to the World Engine, Companion Engine, or any service.
 *
 * Each source contributes one "slice". Slices are deliberately curated (not raw
 * service/engine DTOs) so the interaction side is decoupled from upstream
 * shapes and each slice can carry an `available` flag for graceful degradation.
 */

import type {
  AmbientSound,
  GeneratedWorldDTO,
  Lighting,
  Scene,
  Season,
  TimeOfDay,
  Weather,
} from '@engines/world';
import type {
  Availability,
  CompanionLocation,
  CompanionMood,
  CompanionOutfit,
  CompanionState,
  Expression,
  Gesture,
} from '@engines/companion';

/** Input describing which conversation context to assemble. */
export interface ContextRequest {
  userId: string;
  companionId: string;
  referenceDate?: Date;
  timezone?: string;
  /**
   * Optional pre-synchronized world. When supplied, world and companion slices
   * pin to it for perfect consistency; otherwise each provider resolves the
   * (deterministic) current world independently.
   */
  world?: GeneratedWorldDTO;
  /** Optional caps on how much history to include. */
  limits?: {
    memories?: number;
    moments?: number;
  };
}

// ---------------------------------------------------------------------------
// Slices — one per source
// ---------------------------------------------------------------------------

export interface UserContextSlice {
  available: boolean;
  id?: string;
  username?: string;
  displayName?: string;
  role?: string;
  timezone?: string;
  preferredLanguage?: string;
}

export interface CompanionContextSlice {
  available: boolean;
  companionId?: string;
  name?: string;
  displayName?: string;
  state?: CompanionState;
  mood?: CompanionMood;
  expression?: Expression;
  gesture?: Gesture;
  location?: CompanionLocation;
  outfit?: CompanionOutfit;
  availability?: Availability;
  timeOfDay?: TimeOfDay;
}

export interface WorldContextSlice {
  available: boolean;
  scene?: Scene;
  timeOfDay?: TimeOfDay;
  season?: Season;
  weather?: Weather;
  activity?: string;
  lighting?: Lighting;
  ambientSound?: AmbientSound;
  mood?: string;
}

/**
 * Relationship closeness is deliberately NOT represented as a named
 * level/phase/tier here. Consumers that want to describe "how close" a
 * relationship is should read the raw signals below (and combine them with
 * the memory count from the Memory context slice) rather than branch on a
 * stored label.
 */
export interface RelationshipContextSlice {
  available: boolean;
  status?: string;
  affectionScore?: number;
  trustScore?: number;
  familiarityScore?: number;
  totalInteractions?: number;
  /** Days elapsed since the first recorded interaction. */
  daysSinceFirstInteraction?: number;
  /** Average interactions per week since the first interaction. */
  conversationFrequencyPerWeek?: number;
}

export interface MemoryContextItem {
  id: string;
  type: string;
  importance: string;
  content: string;
}

export interface MemoryContextSlice {
  available: boolean;
  count: number;
  items: MemoryContextItem[];
}

export interface MomentContextItem {
  id: string;
  title: string;
  description?: string;
  significance: number;
  occurredAt: string;
}

export interface MomentsContextSlice {
  available: boolean;
  count: number;
  items: MomentContextItem[];
}

// ---------------------------------------------------------------------------
// Meta + assembled context
// ---------------------------------------------------------------------------

/** Per-provider outcome, for observability and graceful-degradation reporting. */
export interface ContextProviderReport {
  key: string;
  ok: boolean;
  required: boolean;
  degraded: boolean;
  durationMs: number;
  error?: string;
}

export interface ContextMeta {
  timezone: string;
  referenceDate: string;
  /** Keys of optional providers that failed and fell back to an empty slice. */
  degraded: string[];
  providers: ContextProviderReport[];
  buildDurationMs: number;
}

/**
 * The complete runtime context for an interaction. This is the ONLY object the
 * Interaction Engine receives.
 */
export interface InteractionContextDTO {
  requestId: string;
  userId: string;
  companionId: string;
  generatedAt: string;

  user: UserContextSlice;
  companion: CompanionContextSlice;
  world: WorldContextSlice;
  relationship: RelationshipContextSlice;
  memories: MemoryContextSlice;
  moments: MomentsContextSlice;

  meta: ContextMeta;
}

// Backward compatibility alias for services layer
export type ConversationContextDTO = InteractionContextDTO;
