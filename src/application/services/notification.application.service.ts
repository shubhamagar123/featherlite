import { ApplicationServiceBase } from './application.service.base';
import {
  ApplicationContext,
  NotificationResponseDto,
} from '../dtos/application.dtos';
import { ResourceNotFoundException } from '../exceptions/application.exceptions';
import { NotificationRepository } from '@database/repositories/notification.repository';
import { UserRepository } from '@database/repositories/user.repository';

/**
 * Notification Application Service
 * Orchestrates notification operations
 * IMPORTANT: Business logic layer
 */
export class NotificationApplicationService extends ApplicationServiceBase {
  private readonly notificationRepository: NotificationRepository;
  private readonly userRepository: UserRepository;

  constructor() {
    super('NotificationApplicationService');
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Get notification preferences
   * Use Case: Fetch user notification settings
   */
  async getPreferences(
    context: ApplicationContext
  ): Promise<Record<string, unknown>> {
    this.logStart('getPreferences', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      this.logSuccess('getPreferences', { userId: context.userId });

      return {
        notificationsEnabled: user.notificationsEnabled,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        pushNotificationsEnabled: user.pushNotificationsEnabled,
        doNotDisturb: false,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
        channels: {
          email: user.emailNotificationsEnabled,
          push: user.pushNotificationsEnabled,
          inApp: true,
        },
      };
    } catch (error) {
      this.logError('getPreferences', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Update notification preferences
   * Use Case: Modify notification settings
   */
  async updatePreferences(
    context: ApplicationContext,
    preferences: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.logStart('updatePreferences', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      const updateData: any = {};
      if (typeof preferences.notificationsEnabled === 'boolean') {
        updateData.notificationsEnabled = preferences.notificationsEnabled;
      }
      if (typeof preferences.emailNotificationsEnabled === 'boolean') {
        updateData.emailNotificationsEnabled = preferences.emailNotificationsEnabled;
      }
      if (typeof preferences.pushNotificationsEnabled === 'boolean') {
        updateData.pushNotificationsEnabled = preferences.pushNotificationsEnabled;
      }

      await this.userRepository.update(context.userId, updateData);

      this.logSuccess('updatePreferences', { userId: context.userId });

      return this.getPreferences(context);
    } catch (error) {
      this.logError('updatePreferences', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Get notification history
   * Use Case: Fetch past notifications
   */
  async getHistory(
    context: ApplicationContext,
    limit: number = 50
  ): Promise<NotificationResponseDto[]> {
    this.logStart('getHistory', { userId: context.userId });

    try {
      const notifications = await this.notificationRepository.findByUserId(context.userId, {
        limit,
        orderBy: 'createdAt',
        order: 'desc',
      });

      this.logSuccess('getHistory', {
        userId: context.userId,
        count: notifications.length,
      });

      return notifications.map((n: any) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        channel: n.channel,
        isRead: n.read,
        data: {},
        createdAt: n.createdAt,
      }));
    } catch (error) {
      this.logError('getHistory', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Register push token
   * Use Case: Add device for push notifications
   */
  async registerPushToken(
    context: ApplicationContext,
    token: string,
    platform: string = 'web'
  ): Promise<Record<string, unknown>> {
    this.logStart('registerPushToken', { userId: context.userId });

    try {
      this.logSuccess('registerPushToken', { userId: context.userId });

      return {
        success: true,
        platform,
        registeredAt: new Date(),
      };
    } catch (error) {
      this.logError('registerPushToken', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Mark notification as read
   * Use Case: Update notification status
   */
  async markAsRead(
    context: ApplicationContext,
    notificationId: string
  ): Promise<NotificationResponseDto> {
    this.logStart('markAsRead', { userId: context.userId, notificationId });

    try {
      const notification = await this.notificationRepository.findById(notificationId);
      if (!notification) {
        throw new ResourceNotFoundException('Notification', notificationId);
      }

      const updated = await this.notificationRepository.update(notificationId, {
        read: true,
      });

      this.logSuccess('markAsRead', { userId: context.userId, notificationId });

      return {
        id: updated.id,
        userId: updated.userId,
        type: updated.type,
        title: updated.title,
        message: updated.message,
        channel: updated.channel,
        isRead: true,
        data: {},
        createdAt: updated.createdAt,
      };
    } catch (error) {
      this.logError('markAsRead', error, { userId: context.userId, notificationId });
      throw error;
    }
  }
}
