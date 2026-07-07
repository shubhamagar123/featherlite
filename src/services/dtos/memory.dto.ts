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
