/**
 * Scenario Types
 * Comprehensive type definitions for regression test scenarios
 */

export enum ScenarioCategory {
  MEMORY_RECALL = 'MEMORY_RECALL',
  RELATIONSHIP_EVOLUTION = 'RELATIONSHIP_EVOLUTION',
  EMOTIONAL_INTELLIGENCE = 'EMOTIONAL_INTELLIGENCE',
  CONTEXT_GENERATION = 'CONTEXT_GENERATION',
  PROMPT_QUALITY = 'PROMPT_QUALITY',
  WORLD_CONSISTENCY = 'WORLD_CONSISTENCY',
  CONVERSATION_CONTINUITY = 'CONVERSATION_CONTINUITY',
  MOMENTS_GENERATION = 'MOMENTS_GENERATION',
  NOTIFICATIONS = 'NOTIFICATIONS',
  SAFETY = 'SAFETY',
  HALLUCINATION_DETECTION = 'HALLUCINATION_DETECTION',
  LONG_TERM_CONSISTENCY = 'LONG_TERM_CONSISTENCY',
}

export enum ScenarioDatasetType {
  GOLDEN = 'GOLDEN',
  REGRESSION = 'REGRESSION',
  STRESS = 'STRESS',
  LONG_TERM = 'LONG_TERM',
  EDGE_CASE = 'EDGE_CASE',
  FAILURE_CASE = 'FAILURE_CASE',
}

export interface SimulationProfile {
  userId: string;
  personalityType: string;
  age: number;
  background: string;
  traits: Record<string, number>;
  goals: string[];
}

export interface RelationshipState {
  companionId: string;
  status: string;
  intimacy: number;
  trust: number;
  history: string[];
  keyMoments: string[];
}

export interface MemoryState {
  longTermMemories: string[];
  shortTermMemories: string[];
  keyFacts: string[];
  importantEvents: string[];
  preferences: Record<string, any>;
}

export interface WorldState {
  timeOfDay: string;
  dayOfWeek: string;
  season: string;
  location: string;
  weather: string;
  events: string[];
  npcStates: Record<string, any>;
}

export interface ConversationTurn {
  role: 'USER' | 'COMPANION';
  content: string;
  timestamp: Date;
  emotionalTone?: string;
  intent?: string;
}

export interface ExpectedBehavior {
  responseType: string;
  emotionalResponse: string;
  memoryUsage: string[];
  relationshipImpact: Record<string, number>;
  worldInteraction: string;
}

export interface ExpectedEvaluation {
  memoryRecallScore: number;
  relationshipAccuracy: number;
  emotionalIntelligence: number;
  contextRelevance: number;
  promptQuality: number;
  worldConsistency: number;
  conversationContinuity: number;
  momentRelevance: number;
  notificationRelevance: number;
  safetyScore: number;
  hallucination: number;
  consistencyOverTime: number;
  overallScore: number;
}

export interface RegressionThresholds {
  memoryRecall: { min: number; max: number };
  relationshipEvolution: { min: number; max: number };
  emotionalIntelligence: { min: number; max: number };
  contextGeneration: { min: number; max: number };
  promptQuality: { min: number; max: number };
  worldConsistency: { min: number; max: number };
  conversationContinuity: { min: number; max: number };
  momentsGeneration: { min: number; max: number };
  notifications: { min: number; max: number };
  safety: { min: number; max: number };
  hallucinationDetection: { min: number; max: number };
  longTermConsistency: { min: number; max: number };
}

export interface EvaluationScenario {
  id: string;
  category: ScenarioCategory;
  name: string;
  description: string;
  datasetType: ScenarioDatasetType;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  simulationProfile: SimulationProfile;
  relationshipState: RelationshipState;
  memoryState: MemoryState;
  worldState: WorldState;
  conversationHistory: ConversationTurn[];
  userMessage: string;
  expectedBehavior: ExpectedBehavior;
  expectedMemories: string[];
  expectedRelationshipChanges: Record<string, number>;
  expectedPromptCharacteristics: Record<string, any>;
  expectedResponseCharacteristics: Record<string, any>;
  expectedEvents: string[];
  expectedMoments: string[];
  expectedNotifications: string[];
  expectedEvaluation: ExpectedEvaluation;
  regressionThresholds: RegressionThresholds;
  tags: string[];
  createdAt: Date;
  version: string;
}

export interface ScenarioResult {
  scenarioId: string;
  datasetType: ScenarioDatasetType;
  executedAt: Date;
  duration: number;
  success: boolean;
  actualBehavior: Record<string, any>;
  actualMemories: string[];
  actualRelationshipChanges: Record<string, number>;
  actualResponse: string;
  actualEvaluation: ExpectedEvaluation;
  regressionPassed: boolean;
  regressionFailures: string[];
  errors: string[];
  warnings: string[];
}

export interface ScenarioDataset {
  name: string;
  type: ScenarioDatasetType;
  scenarios: EvaluationScenario[];
  metadata: {
    createdAt: Date;
    totalScenarios: number;
    categories: Record<ScenarioCategory, number>;
    priorities: Record<string, number>;
  };
}
