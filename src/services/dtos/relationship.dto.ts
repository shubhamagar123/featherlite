// NOTE: There is deliberately no "level"/"phase"/"tier" field here.
// Closeness is an emergent read computed at query time from firstInteractionAt,
// totalInteractions, and the scores below — never a persisted named stage.
// See src/engines/relationship/README.md.

export interface RelationshipDTO {
  id: string;
  userId: string;
  companionId: string;
  status: string;
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
}

export interface UpdateRelationshipDTO {
  status?: string;
  affectionScore?: number;
  trustScore?: number;
  familiarityScore?: number;
}

export interface RelationshipMetadataDTO {
  id: string;
  companionId: string;
  status: string;
  affectionScore: number;
  lastInteractionAt?: Date;
}
