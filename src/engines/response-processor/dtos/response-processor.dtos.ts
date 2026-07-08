import {
  ResponseProcessingStatus,
  ResponseValidationSeverity,
  SafetyCategory,
  DetectionKind,
  ResponseFormat,
} from '../enums/response-processor.enums';

export interface RawLLMResponse {
  requestId: string;
  userId: string;
  companionId: string;
  correlationId?: string;
  content: string;
  format: ResponseFormat;
  provider: string;
  model: string;
  finishReason: string;
  metadata?: Record<string, unknown>;
}

export interface ParsedResponse {
  requestId: string;
  format: ResponseFormat;
  text?: string;
  json?: unknown;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
}

export interface ResponseValidationIssue {
  code: string;
  severity: ResponseValidationSeverity;
  category?: SafetyCategory;
  message: string;
  span?: { start: number; end: number };
}

export interface ResponseValidationOutcome {
  isValid: boolean;
  isSafe: boolean;
  issues: ResponseValidationIssue[];
}

export interface DetectedItem {
  kind: DetectionKind;
  confidence: number;
  data: Record<string, unknown>;
  reason: string;
}

export interface ProcessedResponse {
  requestId: string;
  userId: string;
  companionId: string;
  status: ResponseProcessingStatus;
  parsed: ParsedResponse;
  validation: ResponseValidationOutcome;
  detections: DetectedItem[];
  finalContent: string;
  processedAt: Date;
  durationMs: number;
}

export interface ResponseProcessingContext {
  raw: RawLLMResponse;
  expectedFormat?: ResponseFormat;
  expectedSchema?: Record<string, unknown>;
}
