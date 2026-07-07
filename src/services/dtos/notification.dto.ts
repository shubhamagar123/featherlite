export interface NotificationDTO {
  id: string;
  userId: string;
  companionId?: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationDTO {
  userId: string;
  companionId?: string;
  type: string;
  channel: string;
  title: string;
  message: string;
}

export interface UpdateNotificationDTO {
  status?: string;
  title?: string;
  message?: string;
}

export interface NotificationMetadataDTO {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: Date;
}

export interface UnreadNotificationCountDTO {
  userId: string;
  unreadCount: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
}
