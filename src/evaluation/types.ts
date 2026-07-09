/**
 * Core Types for Companion Evaluation Platform
 */

export enum EvaluationScenarioType {
  MEMORY_RECALL = 'MEMORY_RECALL',
  RELATIONSHIP_CONSISTENCY = 'RELATIONSHIP_CONSISTENCY',
  CONTEXT_QUALITY = 'CONTEXT_QUALITY',
  PROMPT_QUALITY = 'PROMPT_QUALITY',
  COMPANION_PERSONALITY = 'COMPANION_PERSONALITY',
  EMOTIONAL_INTELLIGENCE = 'EMOTIONAL_INTELLIGENCE',
  CONVERSATION_CONTINUITY = 'CONVERSATION_CONTINUITY',
  SHARED_MEMORY_RECALL = 'SHARED_MEMORY_RECALL',
  FOLLOWUP_ACCURACY = 'FOLLOWUP_ACCURACY',
  MOMENT_GENERATION = 'MOMENT_GENERATION',
  NOTIFICATION_QUALITY = 'NOTIFICATION_QUALITY',
  WORLD_CONSISTENCY = 'WORLD_CONSISTENCY',
  HUMOUR = 'HUMOUR',
  EMPATHY = 'EMPATHY',
  SAFETY = 'SAFETY',
  HALLUCINATION_DETECTION = 'HALLUCINATION_DETECTION',
  SUPPORT = 'SUPPORT',
}

export enum EvaluationDatasetType {
  SMOKE = 'SMOKE',
  REGRESSION = 'REGRESSION',
  MEMORY = 'MEMORY',
  RELATIONSHIP = 'RELATIONSHIP',
  CONTEXT = 'CONTEXT',
  PRODUCTION = 'PRODUCTION',
  LONG_CONVERSATION = 'LONG_CONVERSATION',
  STRESS = 'STRESS',
}

export enum JudgeType {
  MEMORY = 'MEMORY',
  RELATIONSHIP = 'RELATIONSHIP',
  EMOTION = 'EMOTION',
  TONE = 'TONE',
  PERSONALITY = 'PERSONALITY',
  CONTEXT = 'CONTEXT',
  SAFETY = 'SAFETY',
  HALLUCINATION = 'HALLUCINATION',
  NOTIFICATION = 'NOTIFICATION',
  MOMENT = 'MOMENT',
}

export enum ModelProvider {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  GEMINI = 'GEMINI',
  LOCAL = 'LOCAL',
}

export enum EvaluationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface EvaluationScenario {
  id: string;
  type: EvaluationScenarioType;
  description: string;
  conversationHistory: Message[];
  worldState: WorldState;
  relationshipState: RelationshipState;
  memoryState: MemoryState;
  expectedBehaviour: ExpectedBehaviour;
  expectedMemories: ExpectedMemory[];
  expectedTone: string;
  expectedEmotion: string;
  expectedFollowup?: string;
  expectedContext?: string;
  expectedEvents?: string[];
  expectedNotifications?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  metadata?: Record<string, any>;
}

export interface Message {
  role: 'user' | 'companion';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface WorldState {
  currentScene: string;
  atmosphere: string;
  weather: string;
  timeOfDay: string;
  season: string;
  contextualEvents: string[];
  metadata?: Record<string, any>;
}

export interface RelationshipState {
  affinity: number;
  trust: number;
  intimacy: number;
  passion: number;
  interactionCount: number;
  lastInteraction: Date;
  metadata?: Record<string, any>;
}

export interface MemoryState {
  factMemories: Memory[];
  emotionalMemories: Memory[];
  sharedMemories: Memory[];
  totalMemoriesCount: number;
  metadata?: Record<string, any>;
}

export interface Memory {
  id: string;
  content: string;
  type: string;
  importance: number;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface ExpectedBehaviour {
  shouldRecallMemory: boolean;
  shouldUpdateRelationship: boolean;
  shouldGenerateMoment: boolean;
  shouldCreateNotification: boolean;
  shouldShowEmpathy: boolean;
  shouldMaintainPersonality: boolean;
  shouldBeCoherent: boolean;
}

export interface ExpectedMemory {
  content: string;
  type: string;
  importance: number;
}

export interface EvaluationResult {
  scenarioId: string;
  status: EvaluationStatus;
  actualResponse: string;
  judges: JudgeResult[];
  metrics: MetricResult[];
  passed: boolean;
  score: number;
  errors?: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface JudgeResult {
  judgeType: JudgeType;
  score: number;
  feedback: string;
  passed: boolean;
  details?: Record<string, any>;
}

export interface MetricResult {
  name: string;
  value: number;
  unit: string;
  threshold?: number;
  passed: boolean;
  trend?: 'up' | 'down' | 'stable';
}

export interface EvaluationDataset {
  id: string;
  type: EvaluationDatasetType;
  name: string;
  description: string;
  scenarios: EvaluationScenario[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
  metadata?: Record<string, any>;
}

export interface EvaluationReport {
  id: string;
  timestamp: Date;
  datasetType: EvaluationDatasetType;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  averageScore: number;
  metrics: ReportMetrics;
  regressions: RegressionItem[];
  improvements: ImprovementItem[];
  recommendations: string[];
  modelProvider: ModelProvider;
  promptVersion: string;
}

export interface ReportMetrics {
  memoryRecallRate: number;
  memoryPrecisionRate: number;
  relationshipConsistency: number;
  promptQuality: number;
  contextQuality: number;
  averageLatency: number;
  totalTokenUsage: number;
  estimatedCost: number;
  hallucinationRate: number;
  empathyScore: number;
  humourScore: number;
  personalityConsistency: number;
  conversationContinuity: number;
}

export interface RegressionItem {
  scenarioId: string;
  scenarioType: EvaluationScenarioType;
  previousScore: number;
  currentScore: number;
  difference: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ImprovementItem {
  scenarioId: string;
  scenarioType: EvaluationScenarioType;
  previousScore: number;
  currentScore: number;
  difference: number;
  magnitude: 'small' | 'medium' | 'large';
}

export interface EvaluationContext {
  userId?: string;
  companionId?: string;
  modelProvider: ModelProvider;
  promptVersion: string;
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EvaluationPipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  schedule?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStep {
  id: string;
  name: string;
  type: 'scenario_execution' | 'metrics_calculation' | 'report_generation' | 'regression_detection';
  parameters?: Record<string, any>;
  order: number;
}

export interface DashboardData {
  timestamp: Date;
  periodStart: Date;
  periodEnd: Date;
  metrics: ReportMetrics;
  trends: MetricTrend[];
  regressions: RegressionItem[];
  improvements: ImprovementItem[];
  executionStats: ExecutionStats;
  modelComparison: ModelComparisonData[];
  promptVersionComparison: PromptVersionComparison[];
}

export interface MetricTrend {
  metricName: string;
  values: TrendPoint[];
}

export interface TrendPoint {
  timestamp: Date;
  value: number;
}

export interface ExecutionStats {
  totalEvaluations: number;
  completedEvaluations: number;
  failedEvaluations: number;
  averageDuration: number;
  totalCost: number;
}

export interface ModelComparisonData {
  model: ModelProvider;
  metrics: ReportMetrics;
  cost: number;
  latency: number;
  quality: number;
}

export interface PromptVersionComparison {
  version: string;
  metrics: ReportMetrics;
  changesSummary: string;
  performanceDelta: number;
}

export interface GoldenConversation {
  id: string;
  scenarioType: EvaluationScenarioType;
  conversation: Message[];
  worldState: WorldState;
  relationshipState: RelationshipState;
  memoryState: MemoryState;
  expectedResponse: string;
  actualResponses: { [key in ModelProvider]?: string };
  scores: { [key in ModelProvider]?: number };
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}
