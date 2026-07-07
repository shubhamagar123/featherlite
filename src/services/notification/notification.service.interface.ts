import { IResult } from '../types/result.type';
import { NotificationDTO } from '../dtos/notification.dto';
import { CreateNotificationDTO } from '../dtos/notification.dto';

export interface INotificationService {
  createNotification(dto: CreateNotificationDTO): Promise<IResult<NotificationDTO>>;
  getNotificationById(notificationId: string): Promise<IResult<NotificationDTO>>;
  getNotificationsByUserId(userId: string, limit?: number): Promise<IResult<NotificationDTO[]>>;
  getUnreadNotifications(userId: string, limit?: number): Promise<IResult<NotificationDTO[]>>;
  markAsRead(notificationId: string): Promise<IResult<void>>;
  markAllAsRead(userId: string): Promise<IResult<void>>;
  deleteNotification(notificationId: string): Promise<IResult<void>>;
  getUnreadCount(userId: string): Promise<IResult<number>>;
}
