import { BaseService } from '../base/base.service';
import { INotificationService } from './notification.service.interface';
import { IResult, Result } from '../types/result.type';
import { NotificationRepository } from '@database/repositories/notification.repository';
import { NotificationDTO, CreateNotificationDTO } from '../dtos/notification.dto';
import { NotificationMapper } from '../mappers/notification.mapper';
import { InputValidator } from '../validators/input.validators';
import { NotFoundError } from '../exceptions';

export class NotificationService extends BaseService implements INotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {
    super();
  }

  async createNotification(dto: CreateNotificationDTO): Promise<IResult<NotificationDTO>> {
    try {
      InputValidator.requireValidUUID(dto.userId, 'userId');
      InputValidator.requireNotEmpty(dto.title, 'title');
      InputValidator.requireNotEmpty(dto.message, 'message');
      InputValidator.requireNotEmpty(dto.type, 'type');
      InputValidator.requireNotEmpty(dto.channel, 'channel');

      const notification = await this.notificationRepository.create({
        userId: dto.userId,
        companionId: dto.companionId || null,
        title: dto.title,
        message: dto.message,
        type: dto.type as any,
        channel: dto.channel as any,
        status: 'READ' as any,
      } as any);

      this.logBusinessEvent('notification_created', {
        notificationId: notification.id,
        userId: dto.userId,
        type: dto.type,
      });

      return Result.success(NotificationMapper.toDTO(notification));
    } catch (error) {
      this.logError(error as Error, 'Failed to create notification');
      return Result.failure(new Error('Failed to create notification'));
    }
  }

  async getNotificationById(notificationId: string): Promise<IResult<NotificationDTO>> {
    try {
      InputValidator.requireValidUUID(notificationId, 'notificationId');
      const notification = await this.notificationRepository.findById(notificationId);
      if (!notification) return Result.failure(new NotFoundError('Notification', notificationId));
      return Result.success(NotificationMapper.toDTO(notification));
    } catch (error) {
      this.logError(error as Error, 'Failed to get notification');
      return Result.failure(new Error('Failed to get notification'));
    }
  }

  async getNotificationsByUserId(userId: string, limit: number = 50): Promise<IResult<NotificationDTO[]>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requirePositive(limit, 'limit');
      const notifications = await this.notificationRepository.findByUserId(userId, { take: limit });
      return Result.success(NotificationMapper.toDTOArray(notifications));
    } catch (error) {
      this.logError(error as Error, 'Failed to get notifications');
      return Result.failure(new Error('Failed to get notifications'));
    }
  }

  async getUnreadNotifications(userId: string, limit: number = 50): Promise<IResult<NotificationDTO[]>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      InputValidator.requirePositive(limit, 'limit');
      const notifications = await this.notificationRepository.findUnreadByUserId(userId, { take: limit });
      return Result.success(NotificationMapper.toDTOArray(notifications));
    } catch (error) {
      this.logError(error as Error, 'Failed to get unread notifications');
      return Result.failure(new Error('Failed to get unread notifications'));
    }
  }

  async markAsRead(notificationId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(notificationId, 'notificationId');
      await this.notificationRepository.update(notificationId, { status: 'READ' });
      this.logBusinessEvent('notification_marked_as_read', { notificationId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to mark notification as read');
      return Result.failure(new Error('Failed to mark notification as read'));
    }
  }

  async markAllAsRead(userId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      await this.notificationRepository.markAllAsReadByUserId(userId);
      this.logBusinessEvent('all_notifications_marked_as_read', { userId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to mark all notifications as read');
      return Result.failure(new Error('Failed to mark all notifications as read'));
    }
  }

  async deleteNotification(notificationId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(notificationId, 'notificationId');
      await this.notificationRepository.softDelete(notificationId);
      this.logBusinessEvent('notification_deleted', { notificationId });
      return Result.success(undefined);
    } catch (error) {
      this.logError(error as Error, 'Failed to delete notification');
      return Result.failure(new Error('Failed to delete notification'));
    }
  }

  async getUnreadCount(userId: string): Promise<IResult<number>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');
      const count = await this.notificationRepository.countUnreadByUserId(userId);
      return Result.success(count);
    } catch (error) {
      this.logError(error as Error, 'Failed to get unread count');
      return Result.failure(new Error('Failed to get unread count'));
    }
  }
}
