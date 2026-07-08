import {
  MemoryType,
  MemoryImportance,
  MemoryExpiry,
  MemoryCategory,
} from '../enums/memory-extraction.enums';

export interface ExtractedMemoryDTO {
  type: MemoryType;
  importance: MemoryImportance;
  expiry: MemoryExpiry;
  category: MemoryCategory;
  content: string;
  entities?: string[];
  confidence?: number;
}

export interface MemoryExtractionInputDTO {
  userId: string;
  companionId: string;
  content: string;
  context?: {
    conversationId?: string;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
  };
}

export interface MemoryExtractionResultDTO {
  inputId: string;
  memories: ExtractedMemoryDTO[];
  extractedAt: Date;
  confidence: number;
}

export interface RetrieveCriticalMemoriesOptions {
  companionId: string;
  limit?: number;
  includeExpired?: boolean;
}

export interface CriticalMemoryItemDTO {
  id: string;
  type: MemoryType;
  importance: MemoryImportance;
  content: string;
  accessCount: number;
  category: MemoryCategory;
}

export interface CriticalMemoriesSliceDTO {
  count: number;
  items: CriticalMemoryItemDTO[];
}
