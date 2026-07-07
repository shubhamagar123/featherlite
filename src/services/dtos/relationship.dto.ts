export interface RelationshipDTO {
  id: string;
  userId: string;
  companionId: string;
  status: string;
  level: string;
  affectionScore: number;
  trustScore: number;
  familiarityScore: number;
  totalInteractions: number;
  firstInteractionAt?: Date;
  lastInteractionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRelationshipDTO {
  userId: string;
  companionId: string;
  status?: string;
  level?: string;
}

export interface UpdateRelationshipDTO {
  status?: string;
  level?: string;
  affectionScore?: number;
  trustScore?: number;
  familiarityScore?: number;
}

export interface RelationshipMetadataDTO {
  id: string;
  companionId: string;
  status: string;
  level: string;
  affectionScore: number;
  lastInteractionAt?: Date;
}
