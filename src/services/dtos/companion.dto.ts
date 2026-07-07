export interface CompanionDTO {
  id: string;
  userId: string;
  name: string;
  description?: string;
  avatar?: string;
  status: string;
  version: number;
  aiModel: string;
  totalConversations: number;
  totalMessages: number;
  affectionLevel: number;
  engagementScore: number;
  createdAt: Date;
  updatedAt: Date;
  lastInteractionAt?: Date;
}

export interface CompanionDetailDTO extends CompanionDTO {
  personality?: string;
  background?: string;
  systemPrompt?: string;
}

export interface CompanionWithConversationsDTO extends CompanionDTO {
  recentConversationCount: number;
}

export interface CompanionMetadataDTO {
  id: string;
  name: string;
  avatar?: string;
  affectionLevel: number;
  engagementScore: number;
  lastInteractionAt?: Date;
}

export interface CreateCompanionDTO {
  userId: string;
  name: string;
  description?: string;
  avatar?: string;
  aiModel?: string;
  personality?: string;
  background?: string;
  systemPrompt?: string;
}

export interface UpdateCompanionDTO {
  name?: string;
  description?: string;
  avatar?: string;
  personality?: string;
  background?: string;
  systemPrompt?: string;
  status?: string;
}
