export interface MessageDTO {
  id: string;
  conversationId: string;
  userId: string;
  companionId: string;
  content: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageDTO {
  conversationId: string;
  userId: string;
  companionId: string;
  content: string;
  role: string;
}

export interface UpdateMessageDTO {
  content?: string;
  status?: string;
}

export interface MessageMetadataDTO {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  status: string;
}

export interface PaginatedMessagesDTO {
  messages: MessageDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
