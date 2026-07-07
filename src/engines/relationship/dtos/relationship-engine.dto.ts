import { RelationshipLevel, RelationshipStatus } from '../enums/relationship.enums';

export interface RelationshipSnapshotDTO {
  id: string;
  userId: string;
  companionId: string;
  status: RelationshipStatus;
  level: RelationshipLevel;
  affectionScore: number;
  trustScore: number;
  familiarityScore: number;
  totalInteractions: number;
  firstInteractionAt?: Date;
  lastInteractionAt?: Date;
}

export interface ResolveRelationshipOptions {
  userId: string;
  companionId: string;
}
