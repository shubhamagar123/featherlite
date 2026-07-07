import { Notification } from '@prisma/client';
import { NotificationDTO, NotificationMetadataDTO } from '../dtos/notification.dto';

export class NotificationMapper {
  static toDTO(notification: Notification): NotificationDTO {
    return {
      id: notification.id,
      userId: notification.userId,
      companionId: (notification as any).companionId || undefined,
      type: notification.type,
      channel: notification.channel,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      readAt: (notification as any).readAt || undefined,
      createdAt: notification.createdAt,
      updatedAt: (notification as any).updatedAt || notification.createdAt,
    };
  }

  static toMetadataDTO(notification: Notification): NotificationMetadataDTO {
    return {
      id: notification.id,
      title: notification.title,
      type: notification.type,
      status: notification.status,
      createdAt: notification.createdAt,
    };
  }

  static toDTOArray(notifications: Notification[]): NotificationDTO[] {
    return notifications.map((n) => this.toDTO(n));
  }
}
