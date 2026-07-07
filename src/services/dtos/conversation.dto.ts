export interface ConversationDTO {
  id: string;
  userId: string;
  companionId: string;
  title?: string;
  status: string;
  messageCount: number;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDetailDTO extends ConversationDTO {
  context?: string;
}

export interface ConversationWithMessagesDTO extends ConversationDTO {
  messageCount: number;
  messages: any[];
}

export interface CreateConversationDTO {
  userId: string;
  companionId: string;
  title?: string;
}

export interface UpdateConversationDTO {
  title?: string;
  status?: string;
  context?: string;
}

export interface ConversationMetadataDTO {
  id: string;
  title?: string;
  messageCount: number;
  lastMessageAt?: Date;
}
