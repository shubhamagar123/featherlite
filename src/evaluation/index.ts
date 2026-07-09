/**
 * Companion Evaluation Platform (CEP)
 * Production-grade evaluation framework for continuously evaluating Kai and Kia companions
 */

// Types
export * from './types';

// Judges
export { BaseJudge } from './judges/judge.base';
export {
  MemoryJudge,
  RelationshipJudge,
  EmotionJudge,
  ToneJudge,
  PersonalityJudge,
  ContextJudge,
  SafetyJudge,
  HallucinationJudge,
  NotificationJudge,
  MomentJudge,
  JudgeRegistry,
} from './judges';

// Datasets
export { DatasetLoader, DatasetManager } from './datasets';

// Executors
export {
  EvaluationExecutor,
  OpenAIExecutor,
  ClaudeExecutor,
  GeminiExecutor,
  LocalExecutor,
  ExecutorFactory,
} from './executors';

// Metrics
export { MetricsCalculator, TrendAnalyzer } from './metrics';

// Reports
export { ReportGenerator } from './reports';

// Scenarios
export { ScenarioManager } from './scenarios';

// Goldens
export { GoldenManager } from './goldens';

// Comparators
export { ModelComparator, PromptComparator } from './comparators';

// Pipelines
export { EvaluationPipelineExecutor } from './pipelines';

// Dashboards
export { DashboardGenerator } from './dashboards';

// Storage
export { EvaluationStorage } from './storage';
