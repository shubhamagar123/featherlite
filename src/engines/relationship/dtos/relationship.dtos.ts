import {
  RelationshipDimensionType,
  RelationshipStatus,
  RelationshipEventType,
  InteractionQuality,
  GrowthStrategyType,
  RelationshipPhase,
} from '../enums/relationship.enums';
import type { InteractionContextDTO } from '@engines/context';

/** Single relationship dimension state. */
export interface RelationshipDimension {
  type: RelationshipDimensionType;
  value: number; // 0-100
  lastUpdated: Date;
  changeHistory: Array<{ value: number; timestamp: Date; reason: string }>;
  trend: number; // -2 to +2 (acceleration/deceleration)
}

/** Individual event affecting relationship. */
export interface RelationshipEvent {
  id: string;
  type: RelationshipEventType;
  timestamp: Date;
  quality?: InteractionQuality;
  description: string;
  affectedDimensions: RelationshipDimensionType[];
  impact: Record<RelationshipDimensionType, number>; // -10 to +10
  metadata?: Record<string, unknown>;
}

/** Relationship timeline (history of events). */
export interface RelationshipTimeline {
  userId: string;
  companionId: string;
  events: RelationshipEvent[];
  lastEventAt: Date;
  eventCount: number;
  totalImpact: number;
}

/** Snapshot of relationship at a point in time. */
export interface RelationshipSnapshot {
  id: string;
  userId: string;
  companionId: string;
  status: RelationshipStatus;
  phase: RelationshipPhase;
  dimensions: Record<RelationshipDimensionType, RelationshipDimension>;
  overallHealth: number; // 0-100 (average across all dimensions)
  trajectory: number; // -2 to +2 (overall trend)
  strengths: RelationshipDimensionType[]; // Highest dimensions
  vulnerabilities: RelationshipDimensionType[]; // Lowest dimensions
  nextGrowthOpportunity: GrowthStrategyType;
  createdAt: Date;
  updatedAt: Date;
}

/** Request to evaluate an interaction. */
export interface InteractionEvaluationInput {
  conversationContext: InteractionContextDTO;
  quality: InteractionQuality;
  eventType: RelationshipEventType;
  metadata?: Record<string, unknown>;
}

/** Result of interaction evaluation. */
export interface InteractionEvaluationResult {
  quality: InteractionQuality;
  affectedDimensions: RelationshipDimensionType[];
  estimatedImpact: Record<RelationshipDimensionType, number>;
  newEvent: RelationshipEvent;
}

/** Growth factor scoring. */
export interface GrowthFactorScore {
  conversationQuality: number; // 0-10
  conversationFrequency: number; // 0-10 (normalized)
  meaningfulEvents: number; // 0-10 (count of deep interactions)
  sharedMemories: number; // 0-10 (quality + count)
  timeConsistency: number; // 0-10 (how consistent over time)
  positiveInteractions: number; // 0-10 (count / total)
  conflictRepairs: number; // 0-10 (successful repairs)
  overallConsistency: number; // 0-10
}

/** Relationship evolution context. */
export interface RelationshipEvolutionContext {
  currentSnapshot: RelationshipSnapshot;
  timeline: RelationshipTimeline;
  growthFactors: GrowthFactorScore;
  daysSinceInitiation: number;
  nextUpdateDue: Date;
  metadata?: Record<string, unknown>;
}

/** Evolution strategy definition. */
export interface EvolutionStrategy {
  type: GrowthStrategyType;
  priority: number; // 1-10
  description: string;
  targetDimensions: RelationshipDimensionType[];
  estimatedTimeToImpact: number; // days
}

/** Relationship state (complete). */
export interface RelationshipState {
  userId: string;
  companionId: string;
  status: RelationshipStatus;
  phase: RelationshipPhase;
  snapshot: RelationshipSnapshot;
  timeline: RelationshipTimeline;
  activeStrategies: EvolutionStrategy[];
  nextMilestone?: {
    name: string;
    targetDimension: RelationshipDimensionType;
    targetValue: number;
    estimatedDate: Date;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    lastEvaluationAt: Date;
  };
}

/** Context for relationship calculations. */
export interface RelationshipCalculationContext {
  userId: string;
  companionId: string;
  currentDate: Date;
  previousSnapshot?: RelationshipSnapshot;
  recentEvents: RelationshipEvent[];
  conversationHistory?: Array<{ date: Date; quality: InteractionQuality }>;
  sharedMemoriesCount?: number;
  timeElapsedDays: number;
}

/** Rules for dimension growth. */
export interface DimensionGrowthRule {
  dimension: RelationshipDimensionType;
  baseGrowthRate: number; // per day
  eventImpacts: Record<RelationshipEventType, number>;
  qualityMultipliers: Record<InteractionQuality, number>;
  decayRate: number; // if inactive
  maxValue: number; // cap
  minValue: number; // floor
}
