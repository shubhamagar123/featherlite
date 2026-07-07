export interface MomentDTO {
  id: string;
  userId: string;
  companionId: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  imageUrl?: string;
  significance: number;
  isPublic: boolean;
  tags?: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMomentDTO {
  userId: string;
  companionId: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  imageUrl?: string;
  significance?: number;
  tags?: string;
  occurredAt?: Date;
}

export interface UpdateMomentDTO {
  title?: string;
  description?: string;
  significance?: number;
  isPublic?: boolean;
  tags?: string;
  imageUrl?: string;
}

export interface MomentMetadataDTO {
  id: string;
  title: string;
  type: string;
  category: string;
  significance: number;
  createdAt: Date;
}
