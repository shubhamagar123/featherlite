export interface MemoryDTO {
  id: string;
  userId: string;
  companionId: string;
  type: string;
  importance: string;
  content: string;
  accessCount: number;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemoryDTO {
  userId: string;
  companionId: string;
  type: string;
  importance: string;
  content: string;
}

export interface UpdateMemoryDTO {
  importance?: string;
  content?: string;
  type?: string;
}

export interface MemoryMetadataDTO {
  id: string;
  type: string;
  importance: string;
  accessCount: number;
  createdAt: Date;
}

/**
 * Explicit user consent to persist a proposed memory candidate. Required by
 * MemoryService.persistMemoryCandidate — a MemoryExtractionResultDTO is
 * never written to storage without one, and `granted: false` means the
 * candidate is discarded outright (no "pending"/"rejected" record is kept).
 */
export interface ConsentEvent {
  granted: boolean;
  /** Must match the candidate's sourceMessageId, or the write is refused. */
  sourceMessageId: string;
}
