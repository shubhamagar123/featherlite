export interface MemorySnapshotDTO {
  id: string;
  userId: string;
  companionId: string;
  type: string;
  importance: string;
  content: string;
  accessCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetrieveCriticalMemoriesOptions {
  companionId: string;
  limit?: number;
}

export interface CriticalMemoryItemDTO {
  id: string;
  type: string;
  importance: string;
  content: string;
  accessCount: number;
}

export interface CriticalMemoriesSliceDTO {
  count: number;
  items: CriticalMemoryItemDTO[];
}
