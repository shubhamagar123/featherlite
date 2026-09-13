import { PromptRole, PromptType, PromptStrategy, CompressionLevel, PromptStatus } from '../enums/prompt.enums';
import type { InteractionContextDTO } from '@engines/context';
import type { LLMRequestPriority } from '@engines/llm-gateway';

/** A single segment within a prompt (e.g., system context, memory injection, etc.). */
export interface PromptSegment {
  id: string;
  role: PromptRole;
  content: string;
  order: number;
  tokenCount?: number;
  compressed?: boolean;
  version: string;
}

/** Template placeholder and metadata. */
export interface TemplateVariable {
  name: string;
  type: 'context' | 'rule' | 'metadata';
  required: boolean;
  description: string;
  defaultValue?: string;
}

/** Prompt template definition. */
export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  type: PromptType;
  strategy: PromptStrategy;
  content: string;
  variables: TemplateVariable[];
  maxTokens?: number;
  minTokens?: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Context passed to prompt builder. */
export interface PromptBuildContext {
  conversationContext: InteractionContextDTO;
  promptType: PromptType;
  strategy: PromptStrategy;
  compressionLevel?: CompressionLevel;
  maxTokens?: number;
  priority?: LLMRequestPriority;
  metadata?: Record<string, unknown>;
}

/** Compiled rule ready for injection. */
export interface CompiledRule {
  id: string;
  category: string;
  priority: number;
  statement: string;
  isOptional: boolean;
}

/** Analytics about the prompt (for monitoring, A/B testing). */
export interface PromptAnalytics {
  templateId: string;
  strategy: PromptStrategy;
  originalTokens: number;
  finalTokens: number;
  compressionRatio: number;
  segmentCount: number;
  rulesInjected: number;
  buildDurationMs: number;
  timestamp: Date;
}

/** Validation result. */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rulesViolated: string[];
}

/** Final output of the Prompt Orchestrator. */
export interface PromptPayload {
  id: string;
  requestId: string;
  type: PromptType;
  strategy: PromptStrategy;
  status: PromptStatus;

  // Segments (one per role)
  systemPrompt: PromptSegment;
  developerPrompt?: PromptSegment;
  userPrompt: PromptSegment;

  // Metadata
  totalTokens: number;
  segmentCount: number;
  rules: CompiledRule[];
  version: string;

  // Quality assurance
  validation: ValidationResult;
  analytics: PromptAnalytics;

  // Caching
  cacheKey?: string;
  cached: boolean;
  cachedAt?: Date;

  // Timestamps
  builtAt: Date;
  expiresAt?: Date;
}

/** Context injection point definition. */
export interface ContextInjectionPoint {
  name: string;
  path: string; // e.g., "user.displayName", "relationship.trustScore"
  placeholder: string; // e.g., "{{USER_NAME}}", "{{RELATIONSHIP_TRUST}}"
  required: boolean;
  type: string; // e.g., "string", "number", "array"
}

/** Rule definition (before compilation). */
export interface RuleDefinition {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  statement: string;
  examples?: string[];
  exceptions?: string[];
  isOptional?: boolean;
  appliesTo?: PromptType[];
}

/** Compression statistics. */
export interface CompressionStatistics {
  originalLength: number;
  compressedLength: number;
  ratio: number;
  technique: string;
  segmentsAffected: string[];
}

/** Version tracking for A/B testing. */
export interface PromptTemplateVersion {
  templateId: string;
  version: string;
  variantId: string;
  description: string;
  releasedAt: Date;
  deprecated: boolean;
}
