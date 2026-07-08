import {
  LLMProviderType,
  LLMRequestMode,
  LLMResponseStatus,
  LLMProviderStatus,
  LLMSelectionStrategy,
  LLMFinishReason,
} from '../enums/llm-gateway.enums';

export interface LLMMessage {
  role: 'system' | 'developer' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface LLMRequest {
  requestId: string;
  correlationId?: string;
  userId?: string;
  companionId?: string;
  provider?: LLMProviderType;
  model?: string;
  messages: LLMMessage[];
  mode: LLMRequestMode;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
  timeoutMs?: number;
  cacheKey?: string;
  cacheTtlMs?: number;
}

export interface LLMTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMCostBreakdown {
  promptCostUsd: number;
  completionCostUsd: number;
  totalCostUsd: number;
}

export interface LLMResponse {
  requestId: string;
  provider: LLMProviderType;
  model: string;
  status: LLMResponseStatus;
  content: string;
  finishReason: LLMFinishReason;
  usage: LLMTokenUsage;
  cost: LLMCostBreakdown;
  latencyMs: number;
  cached: boolean;
  attempt: number;
  fallbacksUsed: LLMProviderType[];
  createdAt: Date;
  error?: string;
}

export interface LLMStreamChunk {
  requestId: string;
  provider: LLMProviderType;
  model: string;
  delta: string;
  finished: boolean;
  finishReason?: LLMFinishReason;
  index: number;
}

export interface LLMProviderConfig {
  type: LLMProviderType;
  model: string;
  apiKey?: string;
  endpoint?: string;
  enabled: boolean;
  priority: number;
  timeoutMs: number;
  retryAttempts: number;
  fallbackProviders: LLMProviderType[];
  pricing: {
    promptCostPerMillion: number;
    completionCostPerMillion: number;
  };
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface LLMProviderHealth {
  provider: LLMProviderType;
  status: LLMProviderStatus;
  latencyP95Ms: number;
  errorRatePercent: number;
  lastCheckedAt: Date;
  consecutiveFailures: number;
}

export interface LLMUsageSnapshot {
  provider: LLMProviderType;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUsd: number;
  averageLatencyMs: number;
  errorCount: number;
  windowStart: Date;
  windowEnd: Date;
}

export interface LLMSelectionCriteria {
  strategy: LLMSelectionStrategy;
  preferredProvider?: LLMProviderType;
  excludeProviders?: LLMProviderType[];
  maxCostUsd?: number;
  maxLatencyMs?: number;
}

export interface LLMRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}
