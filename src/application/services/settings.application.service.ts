import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';
import { UserRepository } from '@database/repositories/user.repository';
import { ResourceNotFoundException } from '../exceptions/application.exceptions';

/**
 * Settings Application Service
 * Orchestrates user settings and preferences
 * IMPORTANT: Business logic layer
 */
export class SettingsApplicationService extends ApplicationServiceBase {
  private readonly userRepository: UserRepository;

  constructor() {
    super('SettingsApplicationService');
    this.userRepository = new UserRepository();
  }

  /**
   * Get all user settings
   * Use Case: Fetch complete settings
   */
  async getAllSettings(context: ApplicationContext): Promise<Record<string, unknown>> {
    this.logStart('getAllSettings', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      this.logSuccess('getAllSettings', { userId: context.userId });

      return {
        general: {
          language: user.preferredLanguage || 'en',
          timezone: user.timezone || 'UTC',
          theme: 'light',
        },
        privacy: {
          privacyLevel: user.privacyLevel || 'friends',
          profilePublic: false,
          allowSearching: true,
        },
        notifications: {
          enabled: user.notificationsEnabled,
          email: user.emailNotificationsEnabled,
          push: user.pushNotificationsEnabled,
        },
        companion: {
          aiModel: 'default',
          responseStyle: 'conversational',
          verbose: false,
        },
      };
    } catch (error) {
      this.logError('getAllSettings', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Update general settings
   * Use Case: Modify general preferences
   */
  async updateGeneralSettings(
    context: ApplicationContext,
    settings: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.logStart('updateGeneralSettings', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      const updateData: any = {};
      if (typeof settings.language === 'string') {
        updateData.preferredLanguage = settings.language;
      }
      if (typeof settings.timezone === 'string') {
        updateData.timezone = settings.timezone;
      }

      await this.userRepository.update(context.userId, updateData);

      this.logSuccess('updateGeneralSettings', { userId: context.userId });

      return {
        language: settings.language || user.preferredLanguage,
        timezone: settings.timezone || user.timezone,
        theme: settings.theme || 'light',
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logError('updateGeneralSettings', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Update privacy settings
   * Use Case: Modify privacy preferences
   */
  async updatePrivacySettings(
    context: ApplicationContext,
    settings: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.logStart('updatePrivacySettings', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      const updateData: any = {};
      if (typeof settings.privacyLevel === 'string') {
        updateData.privacyLevel = settings.privacyLevel;
      }

      await this.userRepository.update(context.userId, updateData);

      this.logSuccess('updatePrivacySettings', { userId: context.userId });

      return {
        privacyLevel: settings.privacyLevel || user.privacyLevel,
        profilePublic: settings.profilePublic || false,
        allowSearching: settings.allowSearching !== false,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logError('updatePrivacySettings', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Update notification settings
   * Use Case: Modify notification preferences
   */
  async updateNotificationSettings(
    context: ApplicationContext,
    settings: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.logStart('updateNotificationSettings', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      const updateData: any = {};
      if (typeof settings.enabled === 'boolean') {
        updateData.notificationsEnabled = settings.enabled;
      }
      if (typeof settings.email === 'boolean') {
        updateData.emailNotificationsEnabled = settings.email;
      }
      if (typeof settings.push === 'boolean') {
        updateData.pushNotificationsEnabled = settings.push;
      }

      await this.userRepository.update(context.userId, updateData);

      this.logSuccess('updateNotificationSettings', { userId: context.userId });

      return {
        enabled: settings.enabled || user.notificationsEnabled,
        email: settings.email || user.emailNotificationsEnabled,
        push: settings.push || user.pushNotificationsEnabled,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logError('updateNotificationSettings', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Update companion settings
   * Use Case: Configure companion behavior
   */
  async updateCompanionSettings(
    context: ApplicationContext,
    settings: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.logStart('updateCompanionSettings', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      this.logSuccess('updateCompanionSettings', { userId: context.userId });

      return {
        aiModel: settings.aiModel || 'default',
        responseStyle: settings.responseStyle || 'conversational',
        verbose: settings.verbose || false,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logError('updateCompanionSettings', error, { userId: context.userId });
      throw error;
    }
  }
}
