import { MemoryType, MemoryStatus, MemoryVisibility, EntityType, SearchType } from '../enums/memory.enums';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description?: string;
  context?: string;
  metadata?: Record<string, any>;
}

export interface MemoryMetadata {
  memoryId: string;
  memoryType: MemoryType;
  status: MemoryStatus;
  visibility: MemoryVisibility;
  confidence: number;
  importance: number;
  createdAt: Date;
  updatedAt: Date;
  expiryAt?: Date;
  archivedAt?: Date;
}

export interface Memory {
  id: string;
  memoryType: MemoryType;
  title: string;
  description: string;
  entities: Entity[];
  sourceEventId?: string;
  sourceEventType?: string;
  sourceConversationId?: string;
  confidence: number;
  importance: number;
  createdAt: Date;
  updatedAt: Date;
  expiryAt?: Date;
  archivedAt?: Date;
  status: MemoryStatus;
  tags: string[];
  embedding?: number[];
  relationshipId?: string;
  userId: string;
  visibility: MemoryVisibility;
  metadata?: Record<string, any>;
}

export interface ConflictingMemory {
  existingMemory: Memory;
  newMemory: Memory;
  conflictReason: string;
  confidence: number;
}

export interface MemoryMergeResult {
  mergedMemory: Memory;
  mergedIds: string[];
  mergedCount: number;
  conflictsResolved: number;
}

export interface MemorySearchQuery {
  searchType: SearchType;
  query: string;
  userId: string;
  relationshipId?: string;
  memoryType?: MemoryType;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface MemorySearchResult {
  memories: Memory[];
  totalCount: number;
  query: MemorySearchQuery;
  executedAt: Date;
}

export interface MemorySnapshot {
  userId: string;
  relationshipId?: string;
  totalMemories: number;
  memoryTypeDistribution: Record<MemoryType, number>;
  averageImportance: number;
  averageConfidence: number;
  oldestMemory?: Memory;
  newestMemory?: Memory;
  snapshotDate: Date;
}

export interface RankingScores {
  memoryId: string;
  recencyScore: number;
  importanceScore: number;
  confidenceScore: number;
  relevanceScore: number;
  finalRank: number;
}

export interface ExpiryDecision {
  memoryId: string;
  shouldExpire: boolean;
  expiryScore: number;
  reason: string;
  suggestedExpiryDate?: Date;
}

export interface EntityExtractionResult {
  entities: Entity[];
  confidence: number;
  sourceText: string;
}

export interface ClassificationResult {
  memoryType: MemoryType;
  confidence: number;
  alternativeTypes: Array<{ type: MemoryType; confidence: number }>;
}

export interface ImportanceEvaluationResult {
  importance: number;
  factors: Record<string, number>;
  reasoning: string;
}

export interface ConflictResolutionResult {
  resolution: 'MERGE' | 'KEEP_NEW' | 'KEEP_EXISTING' | 'MARK_CONFLICT';
  mergedMemory?: Memory;
  reasoning: string;
}
