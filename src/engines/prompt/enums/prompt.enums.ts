export enum PromptRole {
  SYSTEM = 'SYSTEM',
  DEVELOPER = 'DEVELOPER',
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

export enum PromptType {
  CONVERSATION = 'CONVERSATION',
  MEMORY_EXTRACTION = 'MEMORY_EXTRACTION',
  RELATIONSHIP_UPDATE = 'RELATIONSHIP_UPDATE',
  RECOMMENDATION = 'RECOMMENDATION',
  MOMENT_CREATION = 'MOMENT_CREATION',
  COMPANION_RESPONSE = 'COMPANION_RESPONSE',
  SAFETY_CHECK = 'SAFETY_CHECK',
}

export enum PromptStrategy {
  STANDARD = 'STANDARD',
  DETAILED = 'DETAILED',
  CONCISE = 'CONCISE',
  EMOTIONAL = 'EMOTIONAL',
  ANALYTICAL = 'ANALYTICAL',
}

export enum RuleCategory {
  SAFETY = 'SAFETY',
  PERSONALITY = 'PERSONALITY',
  COMMUNICATION_STYLE = 'COMMUNICATION_STYLE',
  PRODUCT = 'PRODUCT',
  LEGAL = 'LEGAL',
}

export enum RuleSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum CompressionLevel {
  NONE = 'NONE',
  LIGHT = 'LIGHT',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE',
}

export enum CompressionStrategy {
  KEEP_TAIL = 'KEEP_TAIL', // Keep most recent context (default)
  KEEP_HEAD = 'KEEP_HEAD', // Keep initial context (for JSON extraction)
  KEEP_BOTH_ENDS = 'KEEP_BOTH_ENDS', // Keep beginning and end, drop middle
}

export enum PromptStatus {
  BUILDING = 'BUILDING',
  VALIDATING = 'VALIDATING',
  COMPRESSING = 'COMPRESSING',
  READY = 'READY',
  CACHED = 'CACHED',
  ERROR = 'ERROR',
}
